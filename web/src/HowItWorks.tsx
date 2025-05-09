import React from 'react';

const HowItWorks = () => (
  <main className="howitworks-page">
    <h2>How It Works</h2>
    <div className="howitworks-cards">
      <div className="howitworks-card">
        <h3>For Renters</h3>
        <ol>
          <li><strong>Search & Book:</strong> Use our AI-powered search to find the right equipment for your project or event.</li>
          <li><strong>Secure Payment:</strong> Pay safely with Orange Money or card; your funds are held in escrow until you receive the equipment.</li>
          <li><strong>Meet & Use:</strong> Pick up the equipment or arrange delivery, confirm its condition, and use it for your rental period.</li>
          <li><strong>Return & Rate:</strong> Return the equipment on time and rate the owner for future trust.</li>
        </ol>
      </div>
      <div className="howitworks-card">
        <h3>For Owners</h3>
        <ol>
          <li><strong>List Your Equipment:</strong> Upload photos and details. Our AI helps categorize and optimize your listing.</li>
          <li><strong>Approve Bookings:</strong> Get notified when someone wants to rent your equipment. Approve or decline requests easily.</li>
          <li><strong>Meet & Handover:</strong> Arrange a safe handover or delivery. Funds are held in escrow for your security.</li>
          <li><strong>Get Paid & Rate:</strong> After the rental, confirm return and receive your payment. Rate the renter to help the community.</li>
        </ol>
      </div>
    </div>
  </main>
);

export default HowItWorks;
