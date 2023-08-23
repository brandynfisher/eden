import LoadingIndicator from '@/components/LoadingIndicator'
import { Product, useProducts } from '@/hooks/useProducts'
import React from 'react'

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div title={product.name}>
      <div>{product.id}</div>
      <div>{product.name}</div>
      <div>{product.description}</div>
      <div></div>
    </div>
  )
}

const ProductsList = () => {
  const { products } = useProducts()

  return (
    <div>
      <h3 className="font-mono font-bold text-l">Products</h3>
      {!products || !products.length ? (
        <LoadingIndicator />
      ) : (
        <>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </>
      )}
    </div>
  )
}

export default ProductsList
