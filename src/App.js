import './style/style.scss'
import config from './config/config.json'
import abi from './config/abi.json'
import whitelist from './config/whitelist.json'

import { ReactComponent as Twitter } from './img/twitter.svg';
import { ReactComponent as Etherscan } from './img/etherscan.svg';
import { ReactComponent as Opensea } from './img/opensea.svg';
import React, { useState } from 'react'
import { useEthers } from '@usedapp/core';
import Web3 from 'web3';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';


function App() {

  const { account, chainId, library, activateBrowserWallet } = useEthers()

  const [mintCnt, setMintCnt] = useState(1)

  const leafNodes = whitelist.map(addr => keccak256(addr))
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
//  const rootHash = merkleTree.getRoot()

  const handleMintCnt = (c) => {
    let t = mintCnt + c
    if(t > config.maxMintCnt || t < 1)
      return
    setMintCnt(t)
  }

  const handleConnectButton = () => {
    if(!account) {
      activateBrowserWallet()
    }
  }

  const handleMint = async () => {
    const web3 = new Web3(library.provider)
    const contract = new web3.eth.Contract(abi, config.contractAddress, {from: account})

    const balance = await contract.methods.balanceOf(account).call()
    const step = await contract.methods.step().call()

    if(parseInt(balance) + mintCnt > config.maxMintCnt) {
      window.alert(`You already have ${balance} NFTs in your wallet.`)
      return
    }

    if(step === '1') {
      if(whitelist.indexOf(account) === -1) {
        window.alert("You are not on whitelist")
        return
      }
      const claimingNode = leafNodes[whitelist.indexOf(account)]
      const hexProof = merkleTree.getHexProof(claimingNode)
      console.log(hexProof)

      await contract.methods.privateMint(hexProof, mintCnt).send({
        from: account,
        gas: 1500000
      })
    }

    else {
      await contract.methods.publicMint(mintCnt).send({
        from: account,
        gas: 1500000
      })
    }
  }

  return (
    <div className='main-container'>
      <header>
        <div className='social-buttons'>
          <button>
            <a href={config.link.opensea} target='_blank' rel="noreferrer">
              <Opensea width={16} height={16} />
            </a>
          </button>
          <button>
            <a href={config.link.twitter} target='_blank' rel="noreferrer">
              <Twitter width={16} height={16} />
            </a>
          </button>
          <button>
            <a href={config.link.etherscan} target='_blank' rel="noreferrer">
              <Etherscan width={16} height={16} />
            </a>
          </button>
        </div>
        <div className='connect-button'>
          <button
            onClick={handleConnectButton}
            disabled={account ? 'disabled' : ''}
          >
            {
              account ? 'Connected' : "Connect"
            }
          </button>
        </div>
      </header>

      <main>
        <h1>DOGLIN</h1>
        <p>Please mint your DOGLIN NFT</p>

        <div className='counter'>
          <button onClick={() => handleMintCnt(-1)}>-</button>
          <div>{mintCnt}</div>
          <button onClick={() => handleMintCnt(1)}>+</button>
        </div>

        <div className='mint-button'>
          {
            !account ?
              'You must be connected to mint'
            : chainId !== config.chainId ?
              'You must be connected to Ethereum network'
            : 
              <button onClick={handleMint}>
                Mint Now
              </button>
          }
        </div>
      </main>
    </div>
  );
}

export default App;
