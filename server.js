const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const axios = require('axios');
const { JSDOM } = require('jsdom');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

app.get('/auth/gmail', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.modify']
    });
    res.json({ url });
  });

  app.get('/auth/gmail/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      // Send the access token to the client and close the window
      res.send(`
        <script>
          window.opener.postMessage({ token: '${tokens.access_token}' }, '*');
          window.close();
        </script>
      `);
    } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/unsubscribe-emails', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
  
    const token = authHeader.split(' ')[1];
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
  
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread unsubscribe',
        maxResults: 50
      });
  
      const emails = await Promise.all(response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
  
        const url = email.config.url;
        const headers = email.data.payload.headers;
        const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find(header => header.name === 'Date')?.value || 'Undefined Date';
        const senderName = from.match(/^"?(.+?)"?\s*<.*>/)?.[1] || from;
        const senderEmail = from.match(/<(.+)>/)?.[1] || from;
  
        let unsubscribeLink = headers.find(header => header.name === 'List-Unsubscribe')?.value || null;
        if (unsubscribeLink) {
          if(unsubscribeLink.includes('mailto')) {
            unsubscribeLink = null;
          }
          else{
            unsubscribeLink = unsubscribeLink.match(/<(.+)>/)[1];
          }
        }
        else {
            const parts = email.data.payload.parts || [email.data.payload];
            for (const part of parts) {
                if (part.mimeType === 'text/html' && part.body && part.body.data) {
                    const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    const parsedHTML = new JSDOM(content);
                    parsedHTML.window.document.querySelectorAll('a').forEach(a => {
                        if (a.textContent.toLowerCase().includes('unsubscribe')) {
                            unsubscribeLink = a.href;
                        }
                    });
                    if (unsubscribeLink) {
                        break;
                    }
                }
            }
        }
  
        if (unsubscribeLink){
          return {
            id: message.id,
            url,
            date,
            subject,
            senderName,
            senderEmail,
            unsubscribeLink
          };
        }
      }));
  
      res.json(emails);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
      }
  });

  app.post('/api/unsubscribe', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
  
    const token = authHeader.split(' ')[1];
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
  
    const { senderEmail, emailIds, unsubscribeLink } = req.body;
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
    try {
      if (unsubscribeLink) {
        await axios.get(unsubscribeLink);
        await Promise.all(emailIds.map(emailId => 
          gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            resource: {
              removeLabelIds: ['UNREAD']
            }
          })
        ));
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Unsubscribe link not found' });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});