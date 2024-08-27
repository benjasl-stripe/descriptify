import Stripe from 'stripe';
import { useEffect, useState, useCallback } from 'react';
import {
  createHttpClient,
  STRIPE_API_KEY,
} from '@stripe/ui-extension-sdk/http_client';
import {
  Box,
  ContextView,
  Link,
  Divider,
  Inline,
  TextField,
  Banner,
  Button,
} from '@stripe/ui-extension-sdk/ui';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';

const stripeClient = new Stripe(STRIPE_API_KEY, {
  httpClient: createHttpClient(),
  apiVersion: '2020-08-27',
});

const App = ({ userContext }: ExtensionContextValue) => {
  const [apiKeyFound, setApiKeyFound] = useState(true); // Initial state to true assuming key found

  const getApiKey = async () => {
    try {
      const secret = await stripeClient.apps.secrets.find({
        scope: { type: "user", user: userContext.id },
        name: 'openai_api_key',
        expand: ['payload']
      });

      // If the secret is successfully retrieved, set apiKeyFound to true
      if (secret.payload) {
        setApiKeyFound(true);
      } else {
        setApiKeyFound(false);
      }
    } catch (e) {
      console.error(e);
      setApiKeyFound(false); // Set to false on error too
    }
  };

  useEffect(() => {
    getApiKey(); // Call to get API key on component mount
  }, [userContext]);

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
        {/* Only show the banner if the API key is not found */}
        {!apiKeyFound && (
          <Banner
            type="caution"
            title="API key"
            description="To use this Stripe app you must add your OpenAI API key to the App settings page."
            actions={
              <Box css={{ stack: 'x', gap: 'small' }}>
                <Link
                  href="https://dashboard.stripe.com/apps/com.example.descriptify"
                  type="primary" 
                >
                  Take me there
                </Link>
              </Box>
            }
          />
        )}
      </Box>

      <Box
        css={{
          padding: 'large',
          backgroundColor: 'container',
          fontFamily: 'monospace',
          borderRadius: 'small',
        }}
      >
        Select a product from the 
        <Link
          href="https://dashboard.stripe.com/test/products?active=true"
          type="secondary" 
        >
          Products catalogue
        </Link> to get started.
      </Box>
    
    </ContextView>
  );
};

export default App;