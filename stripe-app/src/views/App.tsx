import Stripe from 'stripe';
import { useEffect, useState, useCallback } from 'react';
import {
  createHttpClient,
  STRIPE_API_KEY,
} from '@stripe/ui-extension-sdk/http_client';
import {
  Box,
  ContextView,
  Divider,
  Inline,
  Link,
  TextField,
  Banner,
  Icon,
  Spinner,
  TextArea,
  Button,
} from '@stripe/ui-extension-sdk/ui';

import { showToast } from "@stripe/ui-extension-sdk/utils";



import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';

const stripeClient = new Stripe(STRIPE_API_KEY, {
  httpClient: createHttpClient(),
  apiVersion: '2020-08-27',
});


const updateProductDescription = async (productId, newDescription) => {
  try {
    const updatedProduct = await stripeClient.products.update(productId, {
      description: newDescription,
    });
    return updatedProduct;
  } catch (error) {
    console.error("Failed to update product description:", error);
  }
};


const getSecret = async (uid) => {
  console.log('Fetching secret for user:', uid);
  try {
    const secret = await stripeClient.apps.secrets.find({
      scope: { type: "user", user: uid },
      name: 'openai_api_key',
      expand: ['payload']
    });
    return secret.payload; // Assuming this returns the right payload
  } catch (error) {
    console.error("Error fetching the OpenAI API key:", error);
    return null; // Return null on error
  }
};

const generateDesc = async (apiKey, productName, productFeatures) => {
  const prompt = `Generate product description optimized for SEO for a product named "${productName}" with the following features: ${productFeatures.join(", ")}.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Failed to generate product description:", error);
    showToast("Failed to generate description", {type: "caution"})
    return "Failed to generate description.";
  }
};

const Product = ({ userContext, environment }: ExtensionContextValue) => {
  const [product, setProduct] = useState<Stripe.Product>();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const getProductData = useCallback(async (productId: string) => {
    const data = await stripeClient.products.retrieve(productId);
    setProduct(data);
  }, []);

  useEffect(() => {
    if (environment.objectContext?.id) {
      getProductData(environment.objectContext.id);
    }
  }, [getProductData]);

  const handleSaveDescription = async () => {
    if (product && description) {
      await updateProductDescription(product.id, description);
      console.log("Product description updated successfully!");
      showToast("Product Updated", {type: "success"})
    } else {
      console.error("Product or description is missing.");
      showToast("Product missing", {type: "caution"})
    }
  };


  const handleGenerateDescription = async () => {
    if (product && userContext?.id) {
      const apiKey = await getSecret(userContext.id); // Use userContext.id directly
   
      if (apiKey) { // Check if the API key is retrieved correctly
        const features = tags.split(',').map(tag => tag.trim());

         // Show pending toast
         const { dismiss } = await showToast("Generating description...", { type: "pending" });

         try {
          const generatedDescription = await generateDesc(apiKey, product.name, features);
          setDescription(generatedDescription);

          // Show success toast
          showToast("Description generated successfully!", { type: "success" });
        } catch (error) {
          console.error("Error:", error);

          // Show caution toast on error
          showToast("Failed to generate description.", { type: "caution" });
        } finally {
          // Dismiss the pending toast
          dismiss();
        }

      } else {
        console.error("API Key not found");
        showToast("OpenAI key missing", {type: "caution"})
      }
    }
  };

  return (
    <ContextView title={`Hi, ${userContext?.name}`}>
      <Box
        css={{
          padding: 'large',
          backgroundColor: 'container',
          fontFamily: 'monospace',
          borderRadius: 'small',
        }}
      >
      
        


        <Box css={{ marginBottom: 'xxlarge' }}>
          <Box css={{ font: 'subtitle' }}>Product Details</Box>
          <Divider />
          {!product ? (
            <Box css={{ marginY: 'xxlarge' }}>Loading Product details...</Box>
          ) : (
            <>
              <Box css={{ marginY: 'large' }}>
                Name: <Inline>{product.name}</Inline>
              </Box>
              <Box css={{ marginY: 'large' }}>
                ID: <Inline>{product.id}</Inline>
              </Box>
              <Box css={{ marginY: 'large' }}>
                Created: <Inline>{new Date(product.created * 1000).toLocaleString()}</Inline>
              </Box>
              
              <Divider />

              <Box css={{ marginY: 'large' }}>
                <TextField 
                  label='Tags' 
                  placeholder='Feature tags (comma-separated)' 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)} 
                />
              </Box>
              <Box css={{ marginY: 'large' }}>
                <Button type='primary' onPress={handleGenerateDescription}>
                  
                <Icon name="insight" size="xsmall" />
                <Inline>Generate Description</Inline>
                </Button>


              </Box>

              <Box css={{ marginY: 'large' }}>


                <TextArea 
                  label='Description' 
                  placeholder='Description Suggestion' 
                  value={description}
                   
                />
              </Box>


              <Box css={{ marginY: 'large' }}>
                <Button type='primary' onPress={handleSaveDescription}>
                   
                <Icon name="deploy" size="xsmall" />
                <Inline>Save Description</Inline>
                </Button>
              </Box>

    
            </>
          )}
        </Box>
      </Box>

      <Box css={{ marginY: 'large' }}>
        <Link
          href="https://dashboard.stripe.com/settings/apps/com.example.descriptify"
          type="primary" 
        >
          App Settings
        </Link>
      </Box>

    </ContextView>
  );
};

export default Product;