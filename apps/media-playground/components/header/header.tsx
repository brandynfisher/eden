import HeaderNav from '@/components/navigation/header-nav'
import SearchForm from '@/components/form/search-form'
import MyAccountDropdown from '@/components/navigation/my-account-dropdown'

const Header = () => {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <HeaderNav />
      <SearchForm />
      <MyAccountDropdown />
    </header>
  )
}

export default Header
