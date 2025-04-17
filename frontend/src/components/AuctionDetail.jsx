import { useEffect, useState } from 'react';
import useAuctionStore from '../store/auctionStore';

const AuctionDetail = ({ auctionId }) => {
    const [bidAmount, setBidAmount] = useState('');
    const { 
        currentAuction, 
        loading, 
        error, 
        fetchAuctionById, 
        createBid, 
        fetchAuctionBids 
    } = useAuctionStore();

    useEffect(() => {
        fetchAuctionById(auctionId);
        fetchAuctionBids(auctionId);
    }, [auctionId, fetchAuctionById, fetchAuctionBids]);

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        if (!bidAmount || isNaN(bidAmount)) {
            alert('Please enter a valid bid amount');
            return;
        }

        try {
            await createBid({
                auctionId,
                amount: parseFloat(bidAmount)
            });
            setBidAmount('');
            // Refresh auction and bids
            fetchAuctionById(auctionId);
            fetchAuctionBids(auctionId);
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) return <div>Loading auction details...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!currentAuction) return <div>Auction not found</div>;

    return (
        <div className="auction-detail p-4">
            <h1 className="text-2xl font-bold mb-4">{currentAuction.title}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <img 
                        src={currentAuction.imageUrl} 
                        alt={currentAuction.title} 
                        className="w-full h-64 object-cover rounded"
                    />
                    <p className="mt-4">{currentAuction.description}</p>
                </div>
                
                <div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Bidding Information</h2>
                        <p className="text-lg">
                            Current Price: <span className="font-bold">${currentAuction.currentPrice}</span>
                        </p>
                        <p className="text-gray-600">
                            Ends: {new Date(currentAuction.endTime).toLocaleString()}
                        </p>
                        
                        <form onSubmit={handleBidSubmit} className="mt-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Your Bid Amount
                                </label>
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    min={currentAuction.currentPrice + 1}
                                    step="0.01"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Place Bid
                            </button>
                        </form>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Bid History</h3>
                        <div className="space-y-2">
                            {currentAuction.bids?.map(bid => (
                                <div key={bid._id} className="border p-2 rounded">
                                    <p className="font-semibold">${bid.amount}</p>
                                    <p className="text-sm text-gray-500">
                                        By: {bid.bidderName} at {new Date(bid.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionDetail; 