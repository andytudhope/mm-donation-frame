/*eslint-disable no-undef*/
import React, { Component } from "react";
import "./App.css";

import qrcode from "qrcode-generator";

import Web3 from "web3";

const donationNetworkID = 1; // make sure donations only go through on this network.

const donationAddress = "0xf7050c2908b6c1ccdfb2a44b87853bcc3345e3b3";

const SNTaddress = '0x744d70FDBE2Ba4CF95131626614a1763DF805B9E';
const DAIaddress = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359';
const minABI = [
  // transfer
  {
   "constant": false,
   "inputs": [
    {
     "name": "_to",
     "type": "address"
    },
    {
     "name": "_value",
     "type": "uint256"
    }
   ],
   "name": "transfer",
   "outputs": [
    {
     "name": "",
     "type": "bool"
    }
   ],
   "type": "function"
  }
 ];

var typeNumber = 4;
var errorCorrectionLevel = 'L';
var qr = qrcode(typeNumber, errorCorrectionLevel);

let tokenAddress;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      donateenabled: true,
    };
  }

  handleConnect = async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      try {
          // Request account access if needed
          await ethereum.enable();
          // Acccounts now exposed
          this.setState({
            candonate: true
          });
      } catch (error) {
        this.setState({
          candonate: false
        });
      }
    }
  }

  handleDonate = event => {
    event.preventDefault();
    const form = document.getElementById('donate-form');
    let donateWei = new window.web3.utils.BN(
      window.web3.utils.toWei(form.elements["amount"].value, "ether")
    );
    let message = window.web3.utils.toHex(form.elements["message"].value);
    let extraGas = form.elements["message"].value.length * 68;

    window.web3.eth.net.getId().then(netId => {
      if (netId === donationNetworkID) {
        return window.web3.eth.getAccounts().then(accounts => {
          return window.web3.eth
            .sendTransaction({
              from: accounts[0],
              to: donationAddress,
              value: donateWei,
              gas: 150000 + extraGas,
              data: message
            })
            .catch(e => {
              alert(e);
            });
        });
      } else {
        alert("You cannot make a donation on this network");
        this.setState({
          donateenabled: false
        });
      }
    });
  };

  handleTokenDonate = event => {
    event.preventDefault();
    const form = document.getElementById('token-form');
    let donateTokens = form.elements["token_amount"].value;
    // Use BigNumber
    let decimals = web3.utils.toBN(18);
    let amount = web3.utils.toBN(donateTokens);

    // Select correct contract address
    if (form.elements.token.value === 'snt') {
      tokenAddress = SNTaddress;
    } else if (form.elements.token.value === 'dai') {
      tokenAddress = DAIaddress;
    } else {
      alert("No valid token selected")
    }

    window.web3.eth.net.getId().then(netId => {
      if (netId === donationNetworkID) { 
        return window.web3.eth.getAccounts().then(accounts => {
          // Get ERC20 Token contract instance
          let contract = new window.web3.eth.Contract(minABI, tokenAddress);
          // calculate ERC20 token amount
          let value = amount.mul(web3.utils.toBN(10).pow(decimals));
          // call transfer function
          return contract.methods.transfer(donationAddress, value).send({from: accounts[0]})
            .on('transactionHash', function(hash){
              alert('You can see your donation on https://etherscan.io/tx/' + hash);
            });
          }).catch(e => {
            alert(e);
        });
      } else {
        alert("You cannot make a donation on this network");
        this.setState({
          donateenabled: false
        });
      }
    })
  }

  componentDidMount = () => {
    if (window.ethereum) {
      this.setState({
        privatemode: true
      });
    }
    // Legacy Provider support
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      // Acccounts always exposed
      this.setState({
        candonate: true
      });
    }
    // Non-dapp browsers...
    else {
      this.setState({
        candonate: false
      });
    }
    qr.addData(donationAddress);
    qr.make();
  };

  render = () => {
    const candonate = this.state.candonate;
    const privatemode = this.state.privatemode;

    return (
          <div className="donationColumn">
            {privatemode ? (
              <button onClick={this.handleConnect} className="donation-button">Connect Wallet</button>
            ) : (
              <br />
            )}
              {candonate ? (
                <div className="donation">
                <form id="donate-form">
                  <input
                    type="text"
                    placeholder="ETH to donate"
                    name="amount"
                  />
                  <input type="text" placeholder="message" name="message" />
                  <button onClick={this.handleDonate} className="donation-button">Donate Now!</button>
                  </form>
                  <div className="clear"></div>
                  <form id="token-form">
                  <input
                    type="text"
                    placeholder="Tokens to donate"
                    name="token_amount"
                  />
                  <select className="token-select" name="token">
                    <option value="snt">SNT</option>
                    <option value="dai">DAI</option>
                  </select>
                  <button onClick={this.handleTokenDonate} className="donation-button">Donate Tokens</button>
                </form>
              </div>
              ) : (
                <br />
            )}
            <img alt="qr-code" src={qr.createDataURL(6,2)} />
            <div className="word-wrap">
              <strong>{donationAddress}</strong>
            </div>

          </div>

    );
  }; // End of render()
} // End of class App extends Component

export default App;
/*eslint-enable no-undef*/