import React, { useState, useEffect } from "react";
import {
  Text,
  List,
  Screen,
  Section,
  ScrollView,
  Navigator,
  reactExtension,
  useApi,
  useCartSubscription,
} from "@shopify/ui-extensions-react/point-of-sale";
import { queryProductData, queryVariantData } from "./utils/shopifyQueries";

const Modal = () => {
  const api = useApi();
  const cart = useCartSubscription();
  const [cartIDs, setCartIDs] = useState([]);
  const [variantData, setVariantData] = useState([]);
  const [warrantyProductGids, setWarrantyProductGids] = useState([]);
  const [selectedWarrantyGid, setSelectedWarrantyGid] = useState(null);
  const [warrantyVariants, setWarrantyVariants] = useState([]);

  useEffect(() => {
    setCartIDs(
      cart.lineItems.map((item) => ({
        variantUUID: item.uuid,
        variantId: `gid://shopify/ProductVariant/${item.variantId}`,
        productId: item.productId,
      }))
    );
    console.log("cartIDs", cartIDs);
  }, [cart]);

  useEffect(() => {
    const fetchCartVariants = async () => {
      try {
        // fetch all variants in parallel
        const variantPromises = cartIDs.map((item) =>
          queryVariantData(item.variantId)
        );
        const results = await Promise.all(variantPromises);
        const variantData = results.map((result) => result.data.productVariant);
        // set state with the variant data
        setVariantData(variantData);
        // set state with the warranty product gids found in the warranty metafield for removal from the cart list
        const warrantyGids = variantData
          .filter((variant) => variant?.metafield?.value)
          .map((variant) => variant?.metafield?.value);
        setWarrantyProductGids(warrantyGids);
      } catch (error) {
        console.error("Failed to fetch product data for cart:", error);
      }
    };
    fetchCartVariants();
  }, [cartIDs]);

  function cartItemListComponent(variantData) {
    return variantData?.map((variant) => ({
      id: variant.id,
      onPress: () => {
        if (variant?.metafield?.value) {
          setSelectedWarrantyGid(variant?.metafield?.value);
          api.navigation.navigate("Warranty Selection");
        } else {
          api.toast.show("No warranties available for this item");
        }
      },
      leftSide: {
        label: variant?.product?.title,
        subtitle: [{ content: variant?.title }],
        image: variant?.image?.url
          ? { source: variant?.image?.url }
          : { source: variant?.product?.featuredMedia?.preview?.image?.url },
        badges: [
          variant?.metafield?.value
            ? {
                text: "Warranties Available",
                variant: "success",
                stauts: "complete",
              }
            : {
                text: "No Warranties Available",
                variant: "critical",
                stauts: "complete",
              },
        ],
      },
      rightSide: {
        showChevron: variant?.metafield?.value ? true : false,
      },
    }));
  }

  useEffect(() => {
    if (!selectedWarrantyGid) return;

    const fetchWarrantyProduct = async () => {
      try {
        //console.log("warrantyProductGid", warrantyProductGid);
        const productData = await queryProductData(selectedWarrantyGid);
        //console.log("productData", productData);
        setWarrantyVariants(productData.data.product.variants.edges);
      } catch (error) {
        console.error("Failed to fetch product data for warranty:", error);
      }
    };
    fetchWarrantyProduct();
  }, [selectedWarrantyGid]);

  function warrantyItemListComponent(variantData) {
    return variantData?.map((variant) => ({
      id: variant?.node?.id,
      onPress: () => {
        const variantGid = variant?.node?.id;
        const variantId = parseInt(variantGid.split("/").pop());
        const variantUUID = cartIDs.find(
          (item) => item.variantId === variantGid
        )?.variantUUID;
        console.log(variant?.node?.image?.url);
        if (!cartIDs.some((item) => item.variantId === variantGid)) {
          try {
            api.cart.addLineItem(variantId, 1);
          } catch (error) {
            console.error("Failed to add warranty to cart:", error);
          }
        } else {
          try {
            api.cart.removeLineItem(variantUUID);
          } catch (error) {
            console.error("Failed to remove warranty from cart:", error);
          }
        }
      },
      leftSide: {
        label: variant?.node?.title,
        subtitle: [{ content: variant?.node?.price, color: "TextHighlight" }],
        image: variant?.node?.image?.url,
      },
      rightSide: {
        label: cartIDs.some((item) => item.variantId === variant?.node?.id)
          ? "Remove from Cart"
          : "Add to Cart",
        showChevron: false,
      },
    }));
  }

  //filter out warranty products from the variant data
  const filteredVariantData = variantData.filter(
    (variant) => !warrantyProductGids.includes(variant.product.id)
  );
  // pass the filtered variant data to the cartItemListComponent
  const cartListItems = cartItemListComponent(filteredVariantData);

  // pass the warranty variants to the warrantyItemListComponent
  const warrantyListItems = warrantyItemListComponent(warrantyVariants);

  return (
    <Navigator>
      <Screen name="Products in Cart" title="Products in Cart">
        <ScrollView>
          <Section title="Select a product to view warranties"></Section>
          <List data={cartListItems} imageDisplayStrategy="always" />
        </ScrollView>
      </Screen>
      <Screen name="Warranty Selection" title="Warranty Selection">
        <ScrollView>
          <Section title="Select a warranty"></Section>
          <List data={warrantyListItems} imageDisplayStrategy="always" />
        </ScrollView>
      </Screen>
    </Navigator>
  );
};

export default reactExtension("pos.home.modal.render", () => <Modal />);
