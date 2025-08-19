import { simpleCamelcaseKeys } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useEffect } from 'react'

import { fetchAppUrl, isLoggedAtom } from '~/atoms'
import { setSessionReader } from '~/atoms/hooks/reader'
import { PageLoading } from '~/components/layout/dashboard/PageLoading'
import type { authClient } from '~/lib/authjs'
import { getToken, removeToken } from '~/lib/cookie'
import { apiClient } from '~/lib/request'
import { jotaiStore } from '~/lib/store'

type AdapterUser = typeof authClient.$Infer.Session

export const AuthSessionProvider: Component = ({ children }) => {
  // 检查 better-auth session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    refetchOnMount: 'always',
    queryFn: () =>
      apiClient.proxy.auth.session.get<AdapterUser>({
        params: {
          r: nanoid(),
        },
      }),
  })

  // 检查 JWT token 有效性
  const { data: tokenValid, isLoading: tokenLoading } = useQuery({
    queryKey: ['token-valid'],
    refetchOnMount: 'always',
    queryFn: async () => {
      const token = getToken()
      if (!token) {
        console.log('[AuthSessionProvider] No token found in cookies')
        return false
      }

      console.log(
        '[AuthSessionProvider] Checking token validity:',
        `${token.substring(0, 10)  }...`,
      )

      try {
        const res = await apiClient.user.checkTokenValid(token)
        console.log('[AuthSessionProvider] Token validation result:', res)
        return !!res.ok
      } catch (error) {
        console.error('[AuthSessionProvider] Token validation failed:', error)
        removeToken() // 清除无效的token
        return false
      }
    },
  })

  useEffect(() => {
    // 优先检查session，如果有session且用户是owner，直接设置登录状态
    if (session) {
      const transformedData = simpleCamelcaseKeys(session)
      setSessionReader(transformedData)

      if (transformedData.isOwner) {
        console.log('[AuthSessionProvider] User is logged in via session')
        jotaiStore.set(isLoggedAtom, true)
        fetchAppUrl()
        return
      }
    }

    // 如果没有session或session不是owner，检查JWT token
    if (tokenValid === true) {
      console.log('[AuthSessionProvider] User is logged in via JWT token')
      jotaiStore.set(isLoggedAtom, true)
      fetchAppUrl()
      return
    }

    // 如果都无效，确保登录状态为false
    // 注意：只有当两者都明确检查完毕且都无效时才设置为false
    if (
      (session === null ||
        (session && !simpleCamelcaseKeys(session).isOwner)) &&
      tokenValid === false
    ) {
      console.log('[AuthSessionProvider] User is not logged in')
      jotaiStore.set(isLoggedAtom, false)
    }
  }, [session, tokenValid])

  // 如果还在检查session或token，显示加载状态
  if (sessionLoading || tokenLoading) {
    return <PageLoading />
  }

  return children
}
