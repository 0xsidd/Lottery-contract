const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const should = require('chai').should();


let advlottery;
let signers;
let valueInEthers;
let provider;



describe("Advance Lottery functions", async()=> {
    it("Should create 2 new lottries", async()=> {
  
      const advLotteryO = await ethers.getContractFactory("AdvanceLottery");
      const advlotteryO = await advLotteryO.deploy();
      advlottery = advlotteryO;
      await advlotteryO.deployed();
      const signersO = await ethers.getSigners();
      signers = signersO;
      provider = waffle.provider;
      
      await advlottery.connect(signers[1]).createLottery(5,1);
      await advlottery.connect(signers[2]).createLottery(5,1);
    });
  
    it("Multiple users within the limit are allowed to enter to different lottery", async()=> {
      let valueInInteger = 1;
      valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
      let arr1 = [1,2,3,4];
      let arr2 = [1,3,2,4];
      let arr3 = [1,8,9,7];
      let arr4 = [2,3,9,8];
      await advlottery.connect(signers[3]).enterLottery(arr1,1,{value:valueInEthers});
      await advlottery.connect(signers[4]).enterLottery(arr2,1,{value:valueInEthers});
      await advlottery.connect(signers[5]).enterLottery(arr3,1,{value:valueInEthers});
      await advlottery.connect(signers[6]).enterLottery(arr4,1,{value:valueInEthers});
      await advlottery.connect(signers[3]).enterLottery(arr1,2,{value:valueInEthers});
      await advlottery.connect(signers[4]).enterLottery(arr2,2,{value:valueInEthers});
      await advlottery.connect(signers[5]).enterLottery(arr3,2,{value:valueInEthers});
      await advlottery.connect(signers[6]).enterLottery(arr4,2,{value:valueInEthers});

    });
    it("Lottery owner should be able to declare winners",async()=>{
        let winningNumber = [1,2,9,4];
        await advlottery.connect(signers[1]).getWinner(1,winningNumber);
    })

    it("Lottery owner should be able to claim price", async()=> {
        await advlottery.connect(signers[3]).claimPrice(1);
        await advlottery.connect(signers[4]).claimPrice(1);
        await advlottery.connect(signers[5]).claimPrice(1);
        await advlottery.connect(signers[6]).claimPrice(1);
        await advlottery.connect(signers[3]).claimPrice(2);
        await advlottery.connect(signers[4]).claimPrice(2);
        await advlottery.connect(signers[5]).claimPrice(2);
        await advlottery.connect(signers[6]).claimPrice(2);
    });  
  });




  describe("Advance Lottery error handeling",async()=>{
    beforeEach(async()=>{
        const advLotteryO = await ethers.getContractFactory("AdvanceLottery");
        const advlotteryO = await advLotteryO.deploy();
        advlottery = advlotteryO;
        await advlotteryO.deployed();
        const signersO = await ethers.getSigners();
        signers = signersO;
        provider = waffle.provider;
    })

    it("Should fail if entry price is zero for lottery", async () =>{
        await expect(advlottery.connect(signers[1]).createLottery(5,0)).to.be.revertedWith('Minimum amount to enter lottery required');
    });
    it("Should fail if maximum participants allowed in lottery are less than 3", async function () {
        await expect(advlottery.connect(signers[1]).createLottery(2,1)).to.be.revertedWith('Minimum 2 participants require to create lottery');
    });
    it("Should fail if same user tries to enter particular lottery twice", async function () {
        let valueInInteger = 1;
        let arr1 = [1,2,3,4];
        valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
        await advlottery.connect(signers[1]).createLottery(5,1);
        await advlottery.connect(signers[12]).enterLottery(arr1,1,{value:valueInEthers});
        await expect(advlottery.connect(signers[12]).enterLottery(arr1,1,{value:valueInEthers})).to.be.revertedWith('Cannot enter lottery twice');
    });

    it("Should fail if more participants than limit tries to enter the lottery", async function () {

        let valueInInteger = 1;
        let arr1 = [1,2,3,4];
        valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
        await advlottery.connect(signers[1]).createLottery(5,1);
        await advlottery.connect(signers[2]).enterLottery(arr1,1,{value:valueInEthers});
        await advlottery.connect(signers[4]).enterLottery(arr1,1,{value:valueInEthers});
        await advlottery.connect(signers[5]).enterLottery(arr1,1,{value:valueInEthers});
        await advlottery.connect(signers[6]).enterLottery(arr1,1,{value:valueInEthers});
        await advlottery.connect(signers[7]).enterLottery(arr1,1,{value:valueInEthers});
        await expect(advlottery.connect(signers[7]).enterLottery(arr1,1,{value:valueInEthers})).to.be.revertedWith('Cannot enter lottery twice');
    });

    it("Should fail if user does not enter enough ethers to enter the lottery", async()=> {
        let valueInInteger = 0.5;
        let arr1 = [1,2,3,4];
        valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
        await advlottery.connect(signers[1]).createLottery(5,1);
        await expect(advlottery.connect(signers[7]).enterLottery(arr1,1,{value:valueInEthers})).to.be.revertedWith('Please enter enough amount to enter lottery or call check lotteryPrice function');
    });

    it("Should fail if someone other than lottery owner tries to get lottery winner", async()=> {
        let valueInInteger = 1;
        let arr1 = [1,2,3,4];
        let winnerArr = [1,2,9,4];
        valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
        await advlottery.connect(signers[1]).createLottery(5,1);
        await advlottery.connect(signers[7]).enterLottery(arr1,1,{value:valueInEthers});
        await expect(advlottery.connect(signers[2]).getWinner(1,winnerArr)).to.be.revertedWith('Only lottery owners are allowed to choose winner');
    });
  });

  describe("Advance lottery amount transfers",async()=>{
    beforeEach(async()=>{
        const advLotteryO = await ethers.getContractFactory("AdvanceLottery");
        const advlotteryO = await advLotteryO.deploy();
        advlottery = advlotteryO;
        await advlotteryO.deployed();
        const signersO = await ethers.getSigners();
        signers = signersO;
        provider = waffle.provider;
    });

    it("Should distribute winning price accoudingly",async()=>{
        let arr1 = [1,2,3,4];
        let arr2 = [1,3,2,4];
        let arr3 = [1,8,9,7];
        let arr4 = [1,3,9,8];
        let winnerArr = [1,2,3,0];
        let iniBalP3 = await provider.getBalance(signers[3].address);
        let iniBalP4 = await provider.getBalance(signers[4].address);
        let iniBalP5 = await provider.getBalance(signers[5].address);
        let iniBalP6 = await provider.getBalance(signers[6].address);

        let valueInInteger = 10;
        valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
        await advlottery.connect(signers[1]).createLottery(5,10);
        //console.log(await provider.getBalance(signers[3].address));
        await advlottery.connect(signers[3]).enterLottery(arr1,1,{value:valueInEthers});
        await advlottery.connect(signers[4]).enterLottery(arr2,1,{value:valueInEthers});
        await advlottery.connect(signers[5]).enterLottery(arr3,1,{value:valueInEthers});
        await advlottery.connect(signers[6]).enterLottery(arr4,1,{value:valueInEthers});
        console.log(`pot price is ${await advlottery.connect(signers[0]).getPotPrice(1)}`);

        let itmBalP3 = await provider.getBalance(signers[3].address);
        let itmBalP4 = await provider.getBalance(signers[4].address);
        let itmBalP5 = await provider.getBalance(signers[5].address);
        let itmBalP6 = await provider.getBalance(signers[6].address);

        await advlottery.connect(signers[1]).getWinner(1,winnerArr);
        await advlottery.connect(signers[3]).claimPrice(1);
        await advlottery.connect(signers[4]).claimPrice(1);
        await advlottery.connect(signers[5]).claimPrice(1);
        await advlottery.connect(signers[6]).claimPrice(1);

        let fnlBalP3 = await provider.getBalance(signers[3].address);
        let fnlBalP4 = await provider.getBalance(signers[4].address);
        let fnlBalP5 = await provider.getBalance(signers[5].address);
        let fnlBalP6 = await provider.getBalance(signers[6].address);

        console.log(`p3 winning price is ${-iniBalP3/1e18+fnlBalP3/1e18}`);
        console.log(`p4 winning price is ${-iniBalP4/1e18+fnlBalP4/1e18}`);
        console.log(`p5 winning price is ${-iniBalP5/1e18+fnlBalP5/1e18}`);
        console.log(`p6 winning price is ${-iniBalP6/1e18+fnlBalP6/1e18}`);
    });
  })