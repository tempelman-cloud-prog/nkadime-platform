import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Listing, Rental } from './index';
import * as controllers from './controllers';
import { Request, Response } from 'express';

function mockRes() {
  return {
    status: function() { return this; },
    json: function() { return this; }
  } as unknown as Response;
}

describe('Listing status transitions', () => {
  let mongod: MongoMemoryServer;
  let owner: any, renter: any, listing: any;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    owner = await User.create({ name: 'Owner', email: 'owner@example.com', password: 'pw' });
    renter = await User.create({ name: 'Renter', email: 'renter@example.com', password: 'pw' });
    listing = await Listing.create({
      title: 'Test Listing',
      owner: owner._id,
      status: 'available',
      location: 'Test Location',
      price: 100,
      category: 'Test Category',
      description: 'Test Description'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('should set listing to pending approval after rental request creation', async () => {
    const req = { body: { listing: listing._id, renter: renter._id, owner: owner._id, startDate: new Date(), endDate: new Date() } } as Request;
    const res = mockRes();
    await controllers.createRentalRequest(req, res);
    const updated = await Listing.findById(listing._id);
    expect(updated?.status).toBe('pending approval');
  });

  it('should keep listing as pending approval after approval', async () => {
    // Create a rental
    const rental = await Rental.create({ listing: listing._id, renter: renter._id, owner: owner._id, startDate: new Date(), endDate: new Date(), status: 'pending', statusHistory: [] });
    await Listing.findByIdAndUpdate(listing._id, { status: 'pending approval' });
    const req = { params: { rentalId: rental._id }, user: { userId: owner._id } } as any;
    const res = mockRes();
    await controllers.approveRentalRequest(req, res);
    const updated = await Listing.findById(listing._id);
    expect(updated?.status).toBe('pending approval');
  });

  it('should set listing to unavailable after payment', async () => {
    // Create a rental and set to pending approval
    const rental = await Rental.create({ listing: listing._id, renter: renter._id, owner: owner._id, startDate: new Date(), endDate: new Date(), status: 'approved', statusHistory: [] });
    await Listing.findByIdAndUpdate(listing._id, { status: 'pending approval' });
    const req = {
      params: { rentalId: rental._id },
      body: {
        amount: 100,
        method: 'credit_card',
        reference: 'test-ref',
        paidAt: new Date(),
        userId: renter._id
      },
      user: { userId: renter._id }
    } as any;
    const res = mockRes();
    await controllers.addRentalPayment(req, res);
    const updated = await Listing.findById(listing._id);
    expect(updated?.status).toBe('unavailable');
  });

  it('should set listing to available after decline', async () => {
    // Create a rental and set to pending approval
    const rental = await Rental.create({ listing: listing._id, renter: renter._id, owner: owner._id, startDate: new Date(), endDate: new Date(), status: 'pending', statusHistory: [] });
    await Listing.findByIdAndUpdate(listing._id, { status: 'pending approval' });
    const req = { params: { rentalId: rental._id }, user: { userId: owner._id } } as any;
    const res = mockRes();
    await controllers.declineRentalRequest(req, res);
    const updated = await Listing.findById(listing._id);
    expect(updated?.status).toBe('available');
  });

  it('should set listing to available after completion', async () => {
    // Create a rental and set unavailable
    const rental = await Rental.create({ listing: listing._id, renter: renter._id, owner: owner._id, startDate: new Date(), endDate: new Date(), status: 'approved', statusHistory: [] });
    await Listing.findByIdAndUpdate(listing._id, { status: 'unavailable' });
    const req = { params: { rentalId: rental._id }, body: { status: 'completed', userId: owner._id } } as any;
    const res = mockRes();
    await controllers.updateRentalStatusWithAudit(req, res);
    const updated = await Listing.findById(listing._id);
    expect(updated?.status).toBe('available');
  });

  it('should set listing to available after cancellation', async () => {
    // Create a rental and set unavailable
    const rental = await Rental.create({ listing: listing._id, renter: renter._id, owner: owner._id, startDate: new Date(), endDate: new Date(), status: 'approved', statusHistory: [] });
    await Listing.findByIdAndUpdate(listing._id, { status: 'unavailable' });
    const req = { params: { rentalId: rental._id }, body: { status: 'cancelled', userId: owner._id } } as any;
    const res = mockRes();
    await controllers.updateRentalStatusWithAudit(req, res);
    const updated = await Listing.findById(listing._id);
    expect(updated?.status).toBe('available');
  });
});
