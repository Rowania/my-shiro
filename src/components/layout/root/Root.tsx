import { ClientOnly } from '~/components/common/ClientOnly'
import { FABContainer } from '~/components/ui/fab'
import { BackgroundManager } from '~/components/ui/particle-background'

import { Content } from '../content/Content'
import { Footer } from '../footer'
import { Header } from '../header'

export const Root: Component = ({ children }) => {
  return (
    <>
      <ClientOnly>
        <BackgroundManager />
      </ClientOnly>
      <Header />
      <Content>{children}</Content>

      <Footer />
      <ClientOnly>
        <FABContainer />
      </ClientOnly>
    </>
  )
}
