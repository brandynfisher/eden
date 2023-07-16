import CreationMasonry from '@/components/Creation/CreationMasonry'

const HomePage = () => {
  return (
    <div className={`flex flex-col min-h-screen`}>
      <CreationMasonry hasSort={true} />
    </div>
  )
}

export default HomePage
