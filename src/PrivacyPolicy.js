import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy for Gmail Unsubscribe App</h1>
      <p>Last updated: 2024-08-11</p>

      <h2>1. Introduction</h2>
      <p>Welcome to the Gmail Unsubscribe App ("we," "our," or "us"). We are committed to protecting your privacy and handling your data in an open and transparent manner. This policy explains how we collect, use, and protect your information when you use our service.</p>

      <h2>2. Information We Collect</h2>
      <p>When you use our app, we collect the following information:</p>
      <ul>
        <li>Your Gmail account information, accessed through Google's OAuth 2.0 protocol</li>
        <li>Email metadata (sender name, sender email, subject line, date, and unsubscribe link) from your unread emails containing "unsubscribe" in the content</li>
        <li>Usage data such as your interactions with our app</li>
      </ul>
      <p>We do not store any of your emails or email content on our servers.</p>

      <h2>3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and maintain our service</li>
        <li>Allow you to view and manage your subscription emails</li>
        <li>Process unsubscribe requests on your behalf</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>

      <h2>5. Third-Party Services</h2>
      <p>We use Google's APIs to access your Gmail account. Your use of Google's services is subject to Google's applicable policies.</p>

      <h2>6. Data Retention</h2>
      <p>We do not store your email data. All email information is fetched in real-time when you use the app and is not retained after your session ends.</p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request that we correct any inaccurate personal information</li>
        <li>Request that we delete your personal information</li>
        <li>Withdraw your consent at any time by disconnecting your Gmail account from our app</li>
      </ul>

      <h2>8. Changes to This Policy</h2>
      <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

      <h2>9. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at <a href='mailto:tejitpabari99@gmail.com'>tejitpabari99@gmail.com</a>.</p>
    </div>
  );
}

export default PrivacyPolicy;