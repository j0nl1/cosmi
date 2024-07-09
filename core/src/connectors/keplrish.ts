import type { Keplr } from '@keplr-wallet/types'

import {
  type Address,
  type Prettify,
  ResourceUnavailableRpcError,
  type RpcError,
  UserRejectedRequestError,
  withRetry,
} from 'viem'
import { type Connector, createConnector, ProviderNotFoundError } from 'wagmi'
import type { SignDoc } from '../types/signature.js'
import { createSigningClient } from '../client/clients.js'
import type { Chain } from '../types/chain.js'
import { toKeplrChainInfo } from '../utils/toKeplrChainRegistry.js'

type KeplrProvider = {
  enable: Keplr['enable']
  signDirect: Keplr['signDirect']
  signAmino: Keplr['signAmino']
  experimentalSuggestChain: Keplr['experimentalSuggestChain']
  getOfflineSigner: Keplr['getOfflineSigner']
  getOfflineSignerOnlyAmino: Keplr['getOfflineSignerOnlyAmino']
  getOfflineSignerAuto: Keplr['getOfflineSignerAuto']
}

type WalletProvider = KeplrProvider

type Target = {
  icon?: string | undefined
  id: string
  name: string
  provider: (window?: Window | undefined) => WalletProvider | undefined
}

type Window = {
  keplr?: WalletProvider
  cosmostation?: {
    providers: {
      keplr: WalletProvider
    }
  }
  leap?: WalletProvider
}

export type InjectedParameters = {
  /**
   * Some injected providers do not support programmatic disconnect.
   * This flag simulates the disconnect behavior by keeping track of connection status in storage.
   * @default true
   */
  shimDisconnect?: boolean | undefined

  target?: Target | (() => Target)
}

keplrish.type = 'keplrish' as const
export function keplrish(parameters: InjectedParameters = {}) {
  const { shimDisconnect = true } = parameters

  function getTarget(): Prettify<Target & { id: string }> {
    const target = parameters.target
    if (typeof target === 'function') {
      const result = target()
      if (result) return result
    }

    if (typeof target === 'object') return target

    return {
      id: 'injected',
      name: 'Injected',
      provider(window) {
        return window?.keplr
      },
    }
  }

  type Provider = WalletProvider | undefined

  type Properties = {
    signTx(signer: string, signDoc: SignDoc): Promise<any>
  }

  type StorageItem = {
    [_ in 'injected.connected' | `${string}.disconnected`]: true
  } & { 'injected.chainId': string }

  let accountsChanged: Connector['onAccountsChanged'] | undefined

  return createConnector<Provider | undefined, Properties, StorageItem>(
    (config) => ({
      get icon() {
        return getTarget().icon
      },
      get id() {
        return getTarget().id
      },
      get name() {
        return getTarget().name
      },
      type: keplrish.type,
      async connect({ chainId: chain, isReconnecting } = {}) {
        const provider = await this.getProvider()
        if (!provider) throw new ProviderNotFoundError()

        const chainId = chain ?? (await this.getChainId())
        let accounts: readonly Address[] = []
        if (isReconnecting) accounts = await this.getAccounts().catch(() => [])
        if (!isReconnecting)
          config.storage?.setItem('injected.chainId', chainId.toString())

        try {
          if (!accounts?.length && !isReconnecting) {
            await provider.enable(chainId.toString()).catch(async () => {
              const chainInfo = config.chains.find(
                (chain) => chain.id === chainId,
              ) as Chain
              const registry = chainInfo.custom?.registry
              if (!registry)
                throw new Error('Chain registry is required to suggest chain')
              const { assets, chain } = registry

              const [chainRes, assetsRes] = await Promise.all([
                fetch(chain),
                fetch(assets),
              ])
              await provider.experimentalSuggestChain(
                toKeplrChainInfo(await chainRes.json(), await assetsRes.json()),
              )
            })

            if (!accountsChanged) {
              accountsChanged = this.onAccountsChanged?.bind(this)
              addEventListener(
                'keplr_keystorechange',
                accountsChanged as unknown as EventListener,
              )
            }

            accounts = await this.getAccounts()
          }

          // Remove disconnected shim if it exists
          if (shimDisconnect)
            await config.storage?.removeItem(`${this.id}.disconnected`)

          // Add connected shim if no target exists
          if (!parameters.target)
            await config.storage?.setItem('injected.connected', true)

          this.onConnect?.({ chainId: chainId.toString() })
          return { accounts, chainId }
        } catch (err) {
          const error = err as RpcError
          if (error.code === UserRejectedRequestError.code)
            throw new UserRejectedRequestError(error)
          if (error.code === ResourceUnavailableRpcError.code)
            throw new ResourceUnavailableRpcError(error)
          throw error
        }
      },
      async disconnect() {
        // Add shim signalling connector is disconnected
        if (shimDisconnect) {
          await config.storage?.setItem(`${this.id}.disconnected`, true)
        }

        if (!parameters.target)
          await config.storage?.removeItem('injected.connected')
        this.onDisconnect()
      },
      async getAccounts() {
        const provider = (await this.getProvider()) as Provider
        if (!provider) throw new ProviderNotFoundError()
        const chainId = await config.storage?.getItem('injected.chainId')
        if (!chainId) throw new Error('Chain ID is required to get accounts')
        const signer = provider.getOfflineSignerOnlyAmino(chainId)
        const accounts = await signer.getAccounts()
        return accounts.map((account) => account.address) as readonly Address[]
      },

      async getProvider() {
        if (typeof window === 'undefined') return undefined

        let provider: Provider
        const target = getTarget()
        if (typeof target.provider === 'function')
          provider = target.provider(window as Window | undefined)
        else provider = target.provider

        return provider
      },
      async getClient(params) {
        const chainId = params?.chainId ?? (await this.getChainId())
        return createSigningClient({
          account: {
            address: '0x000',
            type: 'json-rpc',
            signTx: async (sender: string, signDoc: SignDoc) =>
              this.signTx(sender, signDoc),
          },
          transport: config.transports![chainId],
          chain: config.chains.find((chain) => chain.id === chainId),
        })
      },
      async isAuthorized() {
        try {
          const isDisconnected =
            shimDisconnect &&
            // If shim exists in storage, connector is disconnected
            (await config.storage?.getItem(`${this.id}.disconnected`))
          if (isDisconnected) return false

          // Don't allow injected connector to connect if no target is set and it hasn't already connected
          // (e.g. flag in storage is not set). This prevents a targetless injected connector from connecting
          // automatically whenever there is a targeted connector configured.
          if (!parameters.target) {
            const connected =
              await config.storage?.getItem('injected.connected')
            if (!connected) return false
          }

          // Use retry strategy as some injected wallets (e.g. MetaMask) fail to
          // immediately resolve JSON-RPC requests on page load.
          const accounts = await withRetry(() => this.getAccounts())
          return !!accounts.length
        } catch {
          return false
        }
      },
      async onAccountsChanged(_accounts) {
        // Disconnect if there are no accounts
        const accounts = await this.getAccounts()
        if (accounts.length === 0) this.onDisconnect()
        // Connect if emitter is listening for connect event (e.g. is disconnected and connects through wallet interface)
        else if (config.emitter.listenerCount('connect')) {
          const chainId = await this.getChainId()
          this.onConnect?.({ chainId: chainId.toString() })
          // Remove disconnected shim if it exists
          if (shimDisconnect)
            await config.storage?.removeItem(`${this.id}.disconnected`)
        }
        // Regular change event
        else config.emitter.emit('change', { accounts })
      },
      onChainChanged(chain) {
        const chainId = Number(chain)
        config.emitter.emit('change', { chainId })
      },
      async onConnect({ chainId }) {
        const accounts = await this.getAccounts()
        if (accounts.length === 0) return

        config.emitter.emit('connect', {
          accounts,
          chainId: chainId as unknown as number,
        })
      },
      async getChainId() {
        return (await config.storage?.getItem(
          'injected.chainId',
        )) as unknown as number
      },
      async onDisconnect(_error) {
        if (accountsChanged) {
          removeEventListener(
            'keplr_keystorechange',
            accountsChanged as unknown as EventListener,
          )
          accountsChanged = undefined
        }
        // No need to remove `${this.id}.disconnected` from storage because `onDisconnect` is typically
        // only called when the wallet is disconnected through the wallet's interface, meaning the wallet
        // actually disconnected and we don't need to simulate it.
        config.emitter.emit('disconnect')
      },
      async signTx(signer, signDoc) {
        const provider = await this.getProvider()
        if (!provider) throw new ProviderNotFoundError()

        return await provider.signDirect(signDoc.chainId, signer, signDoc)
      },
    }),
  )
}
