import React from 'react'

import { Tile, reactExtension, useApi, useCartSubscription } from '@shopify/ui-extensions-react/point-of-sale'

const TileComponent = () => {
  const api = useApi();
  const cart = useCartSubscription();
  const enabled = cart.lineItems.length;

  return (
    <Tile
      title="Shopify Warranty Selector"
      subtitle={enabled ? "Warranty Options" : "No items in cart"}
      onPress={() => {api.action.presentModal()}}
      enabled={enabled}
    />
  )
}

export default reactExtension('pos.home.tile.render', () => {
  return <TileComponent />
})
