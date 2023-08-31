import LoadingIndicator from '@/components/LoadingIndicator'
import ProductCard from '@/components/Products/ProductCard'
import { useProducts } from '@/hooks/useProducts'

const ProductsList = ({
  checkoutHandler,
}: {
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const { products } = useProducts()
  const productsSortedByPrice = products?.sort((a, b) => {
    const aPrice = a.displayPrice.unit_amount
    const bPrice = b.displayPrice.unit_amount
    return aPrice > bPrice ? 1 : -1
  })

  return (
    <div>
      <h3 className="font-mono font-bold text-l">Products</h3>
      {!products || !products.length ? (
        <LoadingIndicator />
      ) : (
        <div className="flex gap-4 flex-wrap">
          {productsSortedByPrice.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              checkoutHandler={checkoutHandler}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductsList
