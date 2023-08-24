import LoadingIndicator from '@/components/LoadingIndicator'
import ProductCard from '@/components/Products/ProductCard'
import { useProducts } from '@/hooks/useProducts'

const ProductsList = ({
  checkoutHandler,
}: {
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const { products } = useProducts()

  return (
    <div>
      <h3 className="font-mono font-bold text-l">Products</h3>
      {!products || !products.length ? (
        <LoadingIndicator />
      ) : (
        <div className="flex gap-4">
          {products.map(product => (
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
