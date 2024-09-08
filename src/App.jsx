import React, { useState, useEffect } from "react";
import Web3 from "web3";
import contractABI from "../abi.json";
import "./index.css"; 

const contractAddress = "0xE0AecD7944C9BB8deEf994E63E9D172A101d9885";
let web3 = new Web3(window.ethereum);
let contract = new web3.eth.Contract(contractABI, contractAddress);

const App = () => {
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [tweetContent, setTweetContent] = useState("");
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    if (connectedAccount) {
      displayTweets(connectedAccount);
    }
  }, [connectedAccount]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setConnectedAccount(accounts[0]);
      } catch (err) {
        if (err.code === 4001) {
          console.log("Please connect to MetaMask.");
        } else {
          console.error(err);
        }
      }
    } else {
      console.error("No web3 provider detected");
      document.getElementById("connectMessage").innerText =
        "No web3 provider detected. Please install MetaMask.";
    }
  };

  const createTweet = async (content) => {
    const accounts = await web3.eth.getAccounts();
    try {
      await contract.methods.createTweet(content).send({ from: accounts[0] });
      displayTweets(accounts[0]);
    } catch (error) {
      console.error("User rejected request:", error);
    }
  };

  const displayTweets = async (userAddress) => {
    try {
      const tempTweets = await contract.methods.getAllTweets(userAddress).call();
      console.log("Tweets from contract: ", tempTweets);
  
      const sortedTweets = [...tempTweets].sort((a, b) => 
        Number(b.timestamp) - Number(a.timestamp) // Convert BigInt to Number
      );
  
      setTweets(sortedTweets);
    } catch (error) {
      console.error("Error fetching or displaying tweets:", error);
    }
  };
  

  const likeTweet = async (author, id) => {
    try {
      const accounts = await web3.eth.getAccounts();
      await contract.methods.likeTweet(id,author).send({ from: accounts[0] });
      displayTweets(accounts[0]);
    } catch (error) {
      console.error("User rejected request:", error);
    }
  };

  const shortAddress = (address, startLength = 6, endLength = 4) => {
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  const handleLikeClick = async (id, author) => {
    await likeTweet(author, id);
  };

  const handleTweetSubmit = async (e) => {
    e.preventDefault();
    if (tweetContent.trim()) {
      await createTweet(tweetContent);
      setTweetContent("");
    }
  };

  return (
    <div className="container">
      <h1>Twitter DAPP</h1>
      <div className="connect">
        <button id="connectWalletBtn" onClick={connectWallet}>
          {connectedAccount ? "Wallet Connected" : "Connect Wallet"}
        </button>
        {connectedAccount && (
          <div id="userAddress">Connected: {shortAddress(connectedAccount)}</div>
        )}
      </div>
      {!connectedAccount && (
        <div id="connectMessage">Please connect your wallet to tweet.</div>
      )}
      {connectedAccount && (
        <form id="tweetForm" onSubmit={handleTweetSubmit}>
          <textarea
            id="tweetContent"
            rows="4"
            value={tweetContent}
            onChange={(e) => setTweetContent(e.target.value)}
            placeholder="What's happening?"
          />
          <br />
          <button id="tweetSubmitBtn" type="submit">
            Tweet
          </button>
        </form>
      )}
      <div id="tweetsContainer">
        {tweets.map((tweet) => (
          <div className="tweet" key={tweet.id}>
            <img
              className="user-icon"
              src={`https://avatars.dicebear.com/api/human/${tweet.author}.svg`}
              alt="User Icon"
            />
            <div className="tweet-inner">
              <div className="author">{shortAddress(tweet.author)}</div>
              <div className="content">{tweet.content}</div>
              <button
                className="like-button"
                onClick={() => handleLikeClick(tweet.id, tweet.author)}
              >
                <i className="far fa-heart text-red-500">♥️ </i>
                {console.log(tweet.likes)}
                <span className="likes-count">{tweet.likes.toString()}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
