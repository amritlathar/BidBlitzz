import { useEffect } from 'react';
import useAuctionStore from '../store/auctionStore';

const AuctionList = () => {
    const { 
        auctions, 
        loading, 
        error, 
        fetchAllAuctions 
    } = useAuctionStore();

    useEffect(() => {
        fetchAllAuctions();
    }, [fetchAllAuctions]);

    if (loading) return <div>Loading auctions...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="auction-list">
            <h2>Active Auctions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctions.map(auction => (
                    <div key={auction._id} className="border p-4 rounded-lg shadow">
                        <h3 className="text-xl font-bold">{auction.title}</h3>
                        <p className="text-gray-600">{auction.description}</p>
                        <p className="font-semibold">Current Price: ${auction.currentPrice}</p>
                        <p className="text-sm text-gray-500">
                            Ends: {new Date(auction.endTime).toLocaleString()}
                        </p>
                        <button 
                            onClick={() => window.location.href = `/auction/${auction._id}`}
                            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            View Details
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuctionList; 