import 'photoswipe/dist/photoswipe.css'

import { Gallery, Item } from 'react-photoswipe-gallery'

const LightboxGallery = () => {
  return (
    <Gallery>
      <Item
        original="https://place-hold.it/300x500"
        thumbnail="https://place-hold.it/30x50"
        width="300"
        height="500"
        content={<h1>Hi1!</h1>}
      >
        {({ ref, open }) => (
          <img ref={ref} onClick={open} src="https://place-hold.it/30x50" />
        )}
      </Item>
      <Item
        original="https://place-hold.it/500x300"
        thumbnail="https://place-hold.it/50x30"
        width="768"
        height="1024"
        content={<h1>Hi2!</h1>}
      >
        {({ ref, open }) => (
          <img ref={ref} onClick={open} src="https://place-hold.it/50x30" />
        )}
      </Item>
    </Gallery>
  )
}

export default LightboxGallery
