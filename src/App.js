/*eslint-disable no-undef*/
import React, { Component } from "react";
import "./App.css";

import { css } from "glamor";

import qrcode from "qrcode-generator";

import Web3 from "web3";

const donationNetworkID = 1; // make sure donations only go through on this network.

const donationAddress = "0xf7050c2908b6c1ccdfb2a44b87853bcc3345e3b3"; //replace with the address to watch
const apiKey = "SC1H6JHAK19WC1D3BGV3JWIFD983E7BS58"; //replace with your own key

var typeNumber = 4;
var errorCorrectionLevel = 'L';
var qr = qrcode(typeNumber, errorCorrectionLevel);

const isSearched = searchTerm => item =>
  item.from.toLowerCase().includes(searchTerm.toLowerCase());

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ethlist: [],
      searchTerm: "",
      donateenabled: true,
      socketconnected: false,
      totalAmount: 0
    };
  }

  onSearchChange = event => {
    this.setState({
      searchTerm: event.target.value
    });
  };

  subscribe = address => {
    let ws = new WebSocket("wss://socket.etherscan.io/wshandler");

    function pinger(ws) {
      var timer = setInterval(function() {
        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              event: "ping"
            })
          );
        }
      }, 20000);
      return {
        stop: function() {
          clearInterval(timer);
        }
      };
    }

    ws.onopen = function() {
      this.setState({
        socketconnected: true
      });
      pinger(ws);
      ws.send(
        JSON.stringify({
          event: "txlist",
          address: address
        })
      );
    }.bind(this);
    ws.onmessage = function(evt) {
      let eventData = JSON.parse(evt.data);
      console.log(eventData);
      if (eventData.event === "txlist") {
        let newTransactionsArray = this.state.transactionsArray.concat(
          eventData.result
        );
        this.setState(
          {
            transactionsArray: newTransactionsArray
          },
          () => {
            this.processEthList(newTransactionsArray);
          }
        );
      }
    }.bind(this);
    ws.onerror = function(evt) {
      this.setState({
        socketerror: evt.message,
        socketconnected: false
      });
    }.bind(this);
    ws.onclose = function() {
      this.setState({
        socketerror: "socket closed",
        socketconnected: false
      });
    }.bind(this);
  };

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
        console.log(error);
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
      switch (netId) {
        case 1:
          console.log("You're on mainnet");
          break;
        case 2:
          alert("The Morden test network is deprecated.");
          break;
        case 3:
          console.log("You're on the ropsten test network.");
          break;
        case 4:
          console.log("You're on the Rinkeby test network.");
          break;
        case 42:
          console.log("You're on the Kovan test network.");
          break;
        default:
          console.log("You're on an unknown network.");
      }
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
        console.log("no donation allowed on this network");
        this.setState({
          donateenabled: false
        });
      }
    });
  };

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

    const responsiveness = css({
      "@media(max-width: 700px)": {
        "flex-wrap": "wrap"
      }
    });

    const hiddenOnMobile = css({
      "@media(max-width: 700px)": {
        display: "none"
      }
    });

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
              </div>
              ) : (
                <br />
            )}
            <img src={qr.createDataURL(6,2)} />
            <div className="word-wrap">
              <strong>{donationAddress}</strong>
            </div>

          </div>

    );
  }; // End of render()
} // End of class App extends Component

export default App;
/*eslint-enable no-undef*/