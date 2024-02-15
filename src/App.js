import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css'; // Import your CSS

function CoinDetails({ coin, history }) {
  // Prepare the data for the line chart
  const chartData = history.map(dataPoint => ({date: new Date(dataPoint[0]).toLocaleDateString(), price: dataPoint[1]}));
  const priceChangeColor = coin.price_change_24h < 0 ? 'red' : 'green';

  return (
    <div className="coin-details">
      <h2>{coin.name} ({coin.symbol.toUpperCase()})</h2>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '2em', margin: 0 }}>Current Price: ${coin.current_price}</p>
        <p style={{ color: priceChangeColor, fontSize: '0.8em', margin: 0 }}>
          {coin.price_change_24h > 0 && '+'}{coin.price_change_24h.toFixed(2)}
        </p>
      </div>
      <h2>Historical Data</h2>
      <LineChart width={500} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </div>
  );
}


function App() {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const api_key = 'Your_API_Key'; // replace this with your own API key

  useEffect(() => {
    axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc`, {
      headers: {
        'X-CoinAPI-Key': api_key
      }
    })
      .then(response => {
        setCoins(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data', error);
      });
  }, []);

  const handleCoinSelect = (id) => {
    setLoading(true);
    const selected = coins.find(coin => coin.id === id);
    setSelectedCoin(selected);
  
    // Fetch historical data for the last 5 years
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setFullYear(date.getFullYear() - i);
      const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  
      const promise = axios.get(`https://api.coingecko.com/api/v3/coins/${id}/history?date=${formattedDate}`, {
        headers: {
          'X-CoinAPI-Key': api_key
        }
      })
        .then(response => {
          const price = response.data.market_data.current_price.usd;
          return [Date.parse(formattedDate), price];
        })
        .catch(error => {
          console.error('Error fetching historical data', error);
          return [Date.parse(formattedDate), 0]; // Return a default value
        });
  
      promises.push(promise);
    }
  
    Promise.all(promises)
      .then(history => {
        setHistory(history);
        setLoading(false);
      });
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Tracker with CoinGecko</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <select value={selectedCoin ? selectedCoin.id : ''} onChange={e => handleCoinSelect(e.target.value)}>
              {coins.map(coin => (
                <option key={coin.id} value={coin.id}>{coin.name} ({coin.symbol.toUpperCase()})</option>
              ))}
            </select>
            <DatePicker selected={startDate} onChange={date => setStartDate(date)} />
            <DatePicker selected={endDate} onChange={date => setEndDate(date)} />
            {selectedCoin && <CoinDetails coin={selectedCoin} history={history} />}
          </>
        )}
      </header>
    </div>
  );
}

export default App;
