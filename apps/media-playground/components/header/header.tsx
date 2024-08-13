// import SearchForm from '@/components/form/search-form'
import HeaderNav from '@/components/navigation/header-nav'
import MyAccountButton from '@/components/navigation/my-account-button'

const Header = () => {
  return (
    <header className="sticky z-10 top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <HeaderNav />
      <div className="ml-auto">
        {/*<SearchForm />*/}
        <MyAccountButton />
      </div>
    </header>
  )
}

export default Header
