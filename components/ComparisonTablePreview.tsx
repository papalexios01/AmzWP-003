import React from 'react';
import { ComparisonData, ProductDetails } from '../types';

interface ComparisonTablePreviewProps {
  data: ComparisonData;
  products: ProductDetails[];
  affiliateTag: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-sm ${i < full ? 'text-amber-400' : i === full && hasHalf ? 'text-amber-300' : 'text-slate-200'}`}
          >
            &#9733;
          </span>
        ))}
      </div>
      <span className="text-xs font-bold text-slate-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

const PrimeBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#232F3E] text-white text-[10px] font-bold rounded">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
    Prime
  </span>
);

export const ComparisonTablePreview: React.FC<ComparisonTablePreviewProps> = ({ data, products, affiliateTag }) => {
  const finalTag = (affiliateTag || "tag-20").trim();
  const sortedProducts = data.productIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as ProductDetails[];

  if (sortedProducts.length === 0) return null;

  const coreSpecs = ['Rating', 'Reviews', 'Price', 'Prime', ...(data.specs || []).filter(
    s => !['rating', 'reviews', 'price', 'prime'].includes(s.toLowerCase())
  )];

  const getSpecValue = (product: ProductDetails, spec: string): React.ReactNode => {
    const key = spec.toLowerCase();
    if (key === 'rating') return <StarRating rating={product.rating || 0} />;
    if (key === 'reviews') return (
      <span className="font-semibold text-slate-700">
        {(product.reviewCount || 0).toLocaleString()}
      </span>
    );
    if (key === 'price') return (
      <span className="text-lg font-black text-slate-900">{product.price}</span>
    );
    if (key === 'prime') return product.prime ? <PrimeBadge /> : (
      <span className="text-slate-400 text-xs">Not available</span>
    );
    const val = product.specs?.[spec];
    if (val) return <span className="font-semibold text-slate-700">{val}</span>;
    return <span className="text-slate-300">&mdash;</span>;
  };

  const winnerId = data.winnerId || sortedProducts[0]?.id;

  return (
    <div className="w-full max-w-[1100px] mx-auto my-10 font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-black text-lg tracking-tight">{data.title}</h3>
              <p className="text-slate-400 text-xs mt-1">{sortedProducts.length} products compared</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Live Prices</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: `${Math.max(600, sortedProducts.length * 220)}px` }}>

            <div className={`grid divide-x divide-slate-100`} style={{ gridTemplateColumns: `repeat(${sortedProducts.length}, 1fr)` }}>
              {sortedProducts.map((p, idx) => {
                const isWinner = p.id === winnerId;
                return (
                  <div
                    key={p.id}
                    className={`relative p-6 text-center transition-colors ${isWinner ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/50'}`}
                  >
                    {isWinner && (
                      <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
                        <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-b-xl shadow-lg shadow-blue-500/25">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          Top Pick
                        </span>
                      </div>
                    )}

                    <div className="h-36 flex items-center justify-center mb-4 mt-2">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          className="max-h-full max-w-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                          alt={p.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <span className="text-slate-300 text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug mb-3 line-clamp-2 min-h-[40px]">
                      {p.title}
                    </h4>

                    <div className="flex justify-center mb-3">
                      <StarRating rating={p.rating || 0} />
                    </div>

                    <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                      {p.price}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mb-4">
                      {(p.reviewCount || 0).toLocaleString()} verified ratings
                    </div>

                    <a
                      href={`https://www.amazon.com/dp/${p.asin}?tag=${finalTag}`}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      className={`inline-flex items-center justify-center w-full gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                        isWinner
                          ? 'bg-blue-600 text-white hover:bg-blue-500'
                          : 'bg-slate-900 text-white hover:bg-slate-700'
                      }`}
                    >
                      Check Price
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M7 17l9.2-9.2M17 17V8H8" />
                      </svg>
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100">
              {coreSpecs.filter(s => !['rating', 'reviews', 'price', 'prime'].includes(s.toLowerCase())).length > 0 && (
                <>
                  {coreSpecs
                    .filter(s => !['rating', 'reviews', 'price', 'prime'].includes(s.toLowerCase()))
                    .map((spec, sIdx) => (
                    <div
                      key={spec}
                      className={`grid divide-x divide-slate-100 ${sIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}
                      style={{ gridTemplateColumns: `repeat(${sortedProducts.length}, 1fr)` }}
                    >
                      {sortedProducts.map(p => (
                        <div key={p.id} className="px-6 py-4 text-center">
                          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">{spec}</div>
                          <div className="text-sm">{getSpecValue(p, spec)}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>

            {sortedProducts.some(p => p.prime) && (
              <div
                className="grid divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/30"
                style={{ gridTemplateColumns: `repeat(${sortedProducts.length}, 1fr)` }}
              >
                {sortedProducts.map(p => (
                  <div key={p.id} className="px-6 py-3 text-center">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Shipping</div>
                    <div className="text-sm">{p.prime ? <PrimeBadge /> : <span className="text-slate-400 text-xs">Standard</span>}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            Prices and availability are accurate as of the date/time indicated and are subject to change.
          </p>
        </div>
      </div>
    </div>
  );
};
