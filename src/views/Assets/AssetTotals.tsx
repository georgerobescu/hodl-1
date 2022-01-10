import './AssetTotals.scss';
import { useAssets } from '../../store/Assets';
import { useMemo } from 'react';
import useSimpleCoinPrices from '../../queries/useSimpleCoinPrices';
import { currencyToCoinId } from '../../lib/currencyToCoinId';
import { Balance } from '../Shared/Balance';
import { useSettings } from '../../store/Settings';

export const AssetTotals = () => {
  const { assetCurrencies, groupedAssets } = useAssets();
  const { vsCurrency } = useSettings();
  const priceQueries = useSimpleCoinPrices(assetCurrencies.map(currencyToCoinId), vsCurrency);

  type PriceMap = Record<string, number>;
  const priceMap: PriceMap | null = useMemo(() => {
    if(!priceQueries && assetCurrencies) return null;
    if(!priceQueries.every(q => q.isSuccess)) return null;

    return assetCurrencies.reduce((memo, c) => {
      const coinId = currencyToCoinId(c);

      const priceQuery = priceQueries.find(p => Object.keys(p?.data || {}).includes(coinId));
      if(priceQuery && priceQuery.data) {
        memo[coinId] = priceQuery.data[coinId][vsCurrency];
      }

      return memo;
    }, {} as PriceMap);
  }, [assetCurrencies, priceQueries, vsCurrency]);

  const totalValue = useMemo(() => {
    if(!(priceMap && assetCurrencies && groupedAssets)) { return 0 };
  
    return assetCurrencies.reduce((total, c) => {
      const coinId = currencyToCoinId(c);
      const assets = groupedAssets[c];

      return assets.reduce((assetTotal, a) => assetTotal + (a.balance * priceMap[coinId]), total)
    }, 0);
  }, [assetCurrencies, groupedAssets, priceMap]);

  return (<>
    <div className="asset-totals">
      <div className="total-header">TOTAL</div>
      <div className="total-value"><Balance balance={totalValue} /></div>
    </div>
  </>);
}
