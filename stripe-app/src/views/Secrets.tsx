import { useState } from 'react';
import Stripe from 'stripe';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import {
  Box,
  Button,
  ContextView,
  Inline,
  Accordion,
  AccordionItem,
  TextField
} from '@stripe/ui-extension-sdk/ui';
import {createHttpClient, STRIPE_API_KEY} from '@stripe/ui-extension-sdk/http_client';

const stripe: Stripe = new Stripe(STRIPE_API_KEY, {
  httpClient: createHttpClient() as Stripe.HttpClient,
  apiVersion: '2020-08-27',
});

const App = ({userContext}: ExtensionContextValue) => {
  
  const [logs, setLogs] = useState<Array<string>>([]);

  // Set secret form
  const [secretNameForSetSecret, setSecretNameForSetSecret] = useState('');
  const [secretValueForSetSecret, setSecretValueForSetSecret] = useState('');
  const [secretExpiryForSetSecret, setSecretExpiryForSetSecret] = useState<number | null>(null);

  // Get secret form
  const [secretNameForGetSecret, setSecretNameForGetSecret] = useState('');

  // Delete secret form
  const [secretNameForDeleteSecret, setSecretNameForDeleteSecret] = useState('');

  const appendToLogs = (text: string) => {
    setLogs((currentLogs) => {
      return [text, ...currentLogs];
    });
  }

  const clearLogs = () => {
    setLogs([]);
  }

  const setSecretButtonPressed = async () =>  {
    try {
      const params = {
        scope: { type: "user", user: userContext.id },
        name: 'openai_api_key',
        payload: secretValueForSetSecret,
      };

      if (secretExpiryForSetSecret) {
        params['expires_at'] = secretExpiryForSetSecret;
      }

      const secret = await stripe.apps.secrets.create(params);
      
      appendToLogs('Created secret ' + secret.name);
    } catch(e) {
      console.error(e);
      appendToLogs('ERROR: ' + (e as Error).message);
    }
  }

  const getSecretButtonPressed = async () => {
    try {
      const secret = await stripe.apps.secrets.find(
        {
          scope: { type: "user", user: userContext.id },
          name: 'openai_api_key',
          expand: ['payload']
        }
      );
      appendToLogs("Secret '" + secret.name + "' has value: '" + secret.payload + "', expiration: " + secret.expires_at);
    } catch(e) {
      console.error(e);
      appendToLogs('ERROR: ' + (e as Error).message);
    }
  }

  const deleteSecretButtonPressed = async () => {
    try {
      const secret = await stripe.apps.secrets.deleteWhere(
        {
          scope: { type: "user", user: userContext.id },
          name: 'openai_api_key'
        }
      );
      appendToLogs("Secret '" + secret.name + "' has been deleted");
    } catch(e) {
      console.error(e);
      appendToLogs('ERROR: ' + (e as Error).message);
    }
  }

  const listSecretButtonPressed = async () => {
    try {
      const secrets = await stripe.apps.secrets.list(
        {
          scope: { type: "user", user: userContext.id }
        }
      );

      appendToLogs(secrets.data.length + " secret(s) found");
      for (var i = 0; i < secrets.data.length; i++) {
        appendToLogs("Secret " + (i + 1) + " name: '" + secrets.data[i].name + "', expiration: " + secrets.data[i].expires_at);
      }
    } catch(e) {
      console.error(e);
      appendToLogs('ERROR: ' + (e as Error).message);
    }
  }

  const logsMarkup = () => {
    return logs.map((logLine) => {
      return <Box>{logLine}</Box>;
    });
  }
  
  return (
    <ContextView title='Secret Store'>
      <Box css={{margin: 'medium'}}>
        This Stripe app allows users to generate custom descriptions using OpenAI's language model. Users can input feature tags, and the app returns an SEO-optimized description, enhancing product listings.
        To use this app you must first enter your openai_api_key in the secret store.
      </Box>

      <Box css={{margin: 'medium', layout: 'column', gap: 'medium'}}>
                <TextField label='Secret Name' placeholder='openai_api_key' value='openai_api_key' readOnly onChange={(e) => {
                    setSecretNameForSetSecret(e.target.value);
                }}></TextField>
                <TextField label='Secret Value' type='password' placeholder='secret_abcxyz' onChange={(e) => {
                    setSecretValueForSetSecret(e.target.value);
                }}></TextField>
                <TextField label='Secret Expiration (optional)' placeholder='1234567891' onChange={(e) => {
                    setSecretExpiryForSetSecret(e.target.value);
                }}></TextField>
                <Button type='primary' onPress={setSecretButtonPressed}>Create</Button>
            </Box>
      

   
          <Box css={{margin: 'medium', layout: 'column', gap: 'medium'}}>
            <TextField label='Secret Name' placeholder='openai_api_key' value='openai_api_key' readOnly onChange={(e) => {
              setSecretNameForDeleteSecret(e.target.value);
            }}></TextField>
            <Button type='primary' onPress={deleteSecretButtonPressed}>Delete</Button>
          </Box>
      <Accordion>
      
      
          <Box css={{marginTop: 'large'}}>
            <Box css={{stack: 'x', distribute: 'space-between'}}>
                <Inline css={{font: 'heading'}}>Logs</Inline> <Button onPress={clearLogs}>Clear logs</Button>
            </Box>
            <Box css={{layout: 'column', gap: 'medium', borderRadius: 'small', padding: 'small', marginTop: 'medium', keyline: 'neutral'}}>
                {logsMarkup()}
            </Box>
        </Box>

      </Accordion>
     
    </ContextView>
  );
};

export default App;