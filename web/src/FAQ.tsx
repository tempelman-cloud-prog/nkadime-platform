import React from 'react';

const FAQ = () => (
  <main className="faq-page">
    <h2>Frequently Asked Questions</h2>
    <div className="faq-list">
      <div className="faq-item">
        <h4>What is Nkadime?</h4>
        <p>Nkadime is a peer-to-peer platform that allows people in Botswana to rent or lend equipment easily and securely.</p>
      </div>
      <div className="faq-item">
        <h4>Who can use Nkadime?</h4>
        <p>Anyone in Botswana looking to rent equipment for home, business, events, or farming, as well as owners who want to earn income from their tools.</p>
      </div>
      <div className="faq-item">
        <h4>How do I pay or get paid?</h4>
        <p>Payments are made securely through Orange Money or card. Owners receive payment after the rental is complete and confirmed.</p>
      </div>
      <div className="faq-item">
        <h4>Is it safe?</h4>
        <p>Yes! Nkadime uses AI-powered fraud detection, escrow payments, and a rating system to keep the community safe and trustworthy.</p>
      </div>
      <div className="faq-item">
        <h4>How do I list my equipment?</h4>
        <p>Sign up, upload photos and details of your equipment, and set your price. Our AI helps categorize your listing for better visibility.</p>
      </div>
      <div className="faq-item">
        <h4>What if equipment is damaged?</h4>
        <p>Nkadime offers optional insurance and a dispute resolution process to protect both renters and owners.</p>
      </div>
    </div>
  </main>
);

export default FAQ;
