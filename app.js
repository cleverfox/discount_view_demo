// app.js

document.getElementById('getInfo').addEventListener('click', async () => {
    const rpcUrl = document.getElementById('rpcUrl').value;
    const contractAddress = document.getElementById('contractAddress').value;
    const discountId = document.getElementById('discountId').value;
    const resultsDiv = document.getElementById('results');
    const pair = document.getElementById('pair');

    // Validate inputs
    if (!rpcUrl || !contractAddress) {
        resultsDiv.innerHTML = "<p style='color:red;'>All fields are required!</p>";
        return;
    }

  try {
    // Initialize web3
    const web3 = new Web3(rpcUrl);

    var discountHash="0x0000000000000000000000000000000000000000000000000000000000000000";
    if(discountId){
      discountHash = web3.eth.accounts.hashMessage(discountId,true);
    }
    console.log(discountHash);

    // Contract ABI
    const abi = [
      {
        "type": "function",
        "name": "getDiscount",
        "inputs": [
          { "name": "discount_id", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [
          { "name": "", "type": "uint256", "internalType": "uint256" },
          { "name": "", "type": "uint256", "internalType": "uint256" },
          { "name": "", "type": "uint256", "internalType": "uint256" },
          { "name": "", "type": "uint256", "internalType": "uint256" },
          { "name": "", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "numerator",
        "inputs": [],
        "outputs": [
          { "name": "", "type": "uint256", "internalType": "uint256" } 
        ],
        "stateMutability": "view"
      },
      { "type": "function",
        "name": "denominator",
        "inputs": [],
        "outputs": [
          { "name": "", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "token_buy",
        "inputs": [],
        "outputs": [
          { "name": "", "type": "address", "internalType": "contract WSK" }
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "token_pay",
        "inputs": [],
        "outputs": [
          { "name": "", "type": "address", "internalType": "contract ERC20" }
        ],
        "stateMutability": "view"
      },
    ];

    const erc20_abi = [ {
      "type": "function",
      "name": "symbol",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    } ];


    // Initialize contract
    const contract = new web3.eth.Contract(abi, contractAddress);
    const token_buy = await contract.methods.token_buy().call();
    const token_pay = await contract.methods.token_pay().call();

    const contract_pay = new web3.eth.Contract(erc20_abi, token_pay);
    const contract_buy = new web3.eth.Contract(erc20_abi, token_buy);

    const token_buy_sym = await contract_buy.methods.symbol().call();
    const token_pay_sym = await contract_pay.methods.symbol().call();
    console.log(token_buy_sym , token_pay_sym);


    pair.innerHTML = ` of ${token_buy_sym} by ${token_pay_sym}`;

    const numerator = await contract.methods.numerator().call();
    const denominator = await contract.methods.denominator().call();
    // Call the getDiscount function
    const discountData = await contract.methods.getDiscount(discountHash).call();
    console.log(token_buy, token_pay, numerator, denominator, discountData);

    // Helper function to convert Unix time to RFC 3339
    const toRFC3339 = (unixTime) => {
      const date = new Date(Number(unixTime) * 1000);
      return date.toISOString().replace("T"," ").split(".")[0];
    };

    // Helper function to convert seconds to human-readable interval
    const toInterval = (seconds) => {
      const days = Math.floor(seconds / 86400);
      seconds %= 86400;
      const hours = Math.floor(seconds / 3600);
      seconds %= 3600;
      const minutes = Math.floor(seconds / 60);
      seconds %= 60;

      let result = [];
      if (days) result.push(`${days} day${days > 1 ? 's' : ''}`);
      if (hours) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes) result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      if (seconds) result.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
      return result.join(' ');
    };

    // Helper function to format step and limit
    const toEtherFormat = (value, unit) => {
      if (unit === 'wei') return `${value} wei`;
      if (unit === 'gwei') return `${web3.utils.fromWei(value, 'gwei')} gwei`;
      if (unit === 'ether') return `${web3.utils.fromWei(value, 'ether')} ether`;
      return value;
    };

    var currentTimestamp = Math.floor(Date.now() / 1000);
    // Format output
    const formattedData = {
      now: toRFC3339(currentTimestamp),
      t0: toRFC3339(discountData[0]),
      t1: toRFC3339(discountData[1]),
      value3: toInterval(Number(discountData[2])),
      value4: toEtherFormat(discountData[3], 'wei'), // Assumes step is in wei
      value5: toEtherFormat(discountData[4], 'ether'), // Assumes limit is in ether
      interval: toInterval(Number(discountData[1]-discountData[0])),
      interval_l: toInterval(Number(discountData[1])-currentTimestamp),
    };
    const toGo=Number(discountData[1])-currentTimestamp;
    const pcsLeft=Math.ceil(toGo/Number(discountData[2]));


    var priceData = [];
    if(currentTimestamp>discountData[0] && currentTimestamp < discountData[1]){
      var t=discountData[1]-(BigInt(pcsLeft)*discountData[2])
      for(; t<=discountData[1]; t+=discountData[2]){

        const discount=((discountData[1]-BigInt(t))/discountData[2])*discountData[3];
        priceData.push([Number(t),Number(denominator)/Number(numerator+discount)]);
        //priceData.push([Number(t),Number(numerator+discount)/Number(denominator)]);
      }
    }else{
      priceData.push([currentTimestamp,Number(denominator)/Number(numerator)]);
      priceData.push([currentTimestamp+86400,Number(denominator)/Number(numerator)]);
      priceData.push([currentTimestamp+86400*2,Number(denominator)/Number(numerator)]);
    }
    update_graph(priceData);


    // Display results
    resultsDiv.innerHTML = `
            <p>Discount Info:</p>
            <ul>
                <li>Token to buy: ${token_buy}</li>
                <li>Token to pay: ${token_pay}</li>
                <li>Start Time: ${formattedData.t0}</li>
                <li>End Time: ${formattedData.t1}</li>
                <li>Now: ${formattedData.now}</li>
                <li>Interval: ${formattedData.value3}</li>
                <li>Step: ${formattedData.value4}</li>
                <li>Limit: ${formattedData.value5}</li>
                <li>Interval: ${formattedData.interval}</li>
                <li>Left: ${formattedData.interval_l}</li>

            </ul>
        `;
  } catch (error) {
      resultsDiv.innerHTML = `<p style='color:red;'>Error: ${error.message}</p>`;
      console.log(error);
    }
});

window.onload=function(){
  const args=new URLSearchParams(new URL(window.location.href).search);
  if(args.get("rpcUrl")){
    document.getElementById('rpcUrl').value=args.get("rpcUrl");
  }

  if(args.get("contractAddress")){
    document.getElementById('contractAddress').value=args.get("contractAddress");
  }

  if(args.get("discount")){
    document.getElementById('discountId').value=args.get("discount");
  }

  if(document.getElementById('rpcUrl').value &&
    document.getElementById('contractAddress').value &&
    document.getElementById('discountId').value){
    document.getElementById('getInfo').click()
  }
};




