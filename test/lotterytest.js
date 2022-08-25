const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const should = require('chai').should();

let lottery;
let signers;
let valueInEthers;
let provider;



describe("Lottery functions", ()=> {
  it("Should create 2 new lottries", async function () {

    const LotteryO = await ethers.getContractFactory("Lottery");
    const lotteryO = await LotteryO.deploy();
    lottery = lotteryO;
    await lotteryO.deployed();
    const signersO = await ethers.getSigners();
    signers = signersO;
    provider = waffle.provider;
    
    await lottery.connect(signers[1]).createLottery(5,1);
    await lottery.connect(signers[2]).createLottery(5,1);
  });

  it("Multiple users within the limit are allowed to enter to different lottery", async function () {
    let valueInInteger = 1;
    valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
    for(let i=1; i<=2; i++){
      for(let j=3 ;j<=7; j++)
        await lottery.connect(signers[j]).enterLottery(i,{value:valueInEthers});
    };
  });


  it("Should find a winner and transfer winning amount to winner", async function () {
    await lottery.connect(signers[1]).getWinner(1);
  });


});

describe("Lottery error handeling",()=> {

  beforeEach(async()=>{
    const LotteryO = await ethers.getContractFactory("Lottery");
    const lotteryO = await LotteryO.deploy();
    lottery = lotteryO;
    await lotteryO.deployed();
    const signersO = await ethers.getSigners();
    signers = signersO;
    provider = waffle.provider;
    let valueInInteger = 1;
    valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
  });

  it("Should fail if entry price is zero for lottery", async function () {
    await expect(lottery.connect(signers[1]).createLottery(5,0)).to.be.revertedWith('Minimum amount to enter lottery required');
  });
  it("Should fail if maximum participants allowed in lottery are less than 3", async function () {
    await expect(lottery.connect(signers[1]).createLottery(2,1)).to.be.revertedWith('Minimum 2 participants require to create lottery');
  });

  it("Should fail if same user tries to enter particular lottery twice", async function () {
    await lottery.connect(signers[1]).createLottery(5,1);
    await lottery.connect(signers[12]).enterLottery(1,{value:valueInEthers});
    await expect(lottery.connect(signers[12]).enterLottery(1,{value:valueInEthers})).to.be.revertedWith('Cannot enter lottery twice');
  });
  
  it("Should fail if more participants than limit tries to enter the lottery", async function () {
    
    await lottery.connect(signers[1]).createLottery(5,1);
    await lottery.connect(signers[12]).enterLottery(1,{value:valueInEthers});
    await lottery.connect(signers[13]).enterLottery(1,{value:valueInEthers});
    await lottery.connect(signers[14]).enterLottery(1,{value:valueInEthers});
    await lottery.connect(signers[15]).enterLottery(1,{value:valueInEthers});
    await lottery.connect(signers[16]).enterLottery(1,{value:valueInEthers});
    await expect(lottery.connect(signers[17]).enterLottery(1,{value:valueInEthers})).to.be.revertedWith('Entry is closed');
  });

  it("Should fail if user does not enter enough ethers to enter the lottery", async function () {
    let valueInInteger = 0.5;
    valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
    await lottery.connect(signers[1]).createLottery(5,1);
    await expect(lottery.connect(signers[12]).enterLottery(1,{value:valueInEthers})).to.be.revertedWith('Please enter enough amount to enter lottery or call check lotteryPrice function');
  });

  it("Should fail if someone other than lottery owner tries to get lottery winner", async function () {
    let valueInInteger = 1;
    valueInEthers = (ethers.utils.parseUnits(valueInInteger.toString(), "ether"));
    await lottery.connect(signers[1]).createLottery(5,1);
    await lottery.connect(signers[12]).enterLottery(1,{value:valueInEthers});
    await expect(lottery.connect(signers[2]).getWinner(1)).to.be.revertedWith('Only lottery owners are allowed to choose winner');
    
  });
});

