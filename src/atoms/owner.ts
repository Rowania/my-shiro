import { atom } from 'jotai'

import { getToken, removeToken, setToken } from '~/lib/cookie'
import { apiClient } from '~/lib/request'
import { jotaiStore } from '~/lib/store'
import { toast } from '~/lib/toast'
import { aggregationDataAtom } from '~/providers/root/aggregation-data-provider'

import { refreshToken } from './hooks/owner'
import { fetchAppUrl } from './url'

export const ownerAtom = atom((get) => {
  return get(aggregationDataAtom)?.user
})
export const isLoggedAtom = atom(false)

export const login = async (username?: string, password?: string) => {
  if (username && password) {
    try {
      const user = await apiClient.user
        .login(username, password)
        .catch((err) => {
          console.error(err)
          toast.error('再试试哦')
          throw err
        })
      if (user) {
        const { token } = user
        setToken(token)
        jotaiStore.set(isLoggedAtom, true)

        await fetchAppUrl()
        toast.success(`欢迎回来，${jotaiStore.get(ownerAtom)?.name}`)
      }
    } catch (error) {
      console.error('Login process failed', error)
      // Even if fetchAppUrl fails, we should consider the user logged in.
      // The app URL can be fetched later.
      // But if the login API itself fails, the error is thrown and caught here.
      const token = getToken()
      if (token) {
        // If token is set, login is successful, but fetching url failed.
        // We can proceed.
        return true
      }
      return false
    }

    return true
  }

  const token = getToken()
  if (!token) {
    return
  }
  // const outdateToast = () => toast.warn('登录身份过期了，再登录一下吧！')
  const validated = await apiClient.user
    .checkTokenValid(token)
    .then((res) => !!res.ok)

    .catch(() => {
      removeToken()
      // outdateToast()
      return false
    })

  if (!validated) {
    // outdateToast()
    removeToken()
    return
  }

  await refreshToken()

  return true
}

export const isLogged = () => jotaiStore.get(isLoggedAtom)
