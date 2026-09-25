import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("DiscreteBean", function () {

  it("Should get BEAN from symbol()", async function () {
    const contract = await ethers.deployContract("DiscreteBean",[3]);
    expect(await contract.symbol()).equals("BEAN");
  })

  it("Should get Bean from name()", async function () {
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.name()).equals("Bean");
  })

  it("Should get 0 from decimals()", async function () {
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.decimals()).equals(0);
  })

  it("Should get 3 as initial supply", async function () {
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.totalSupply()).equals(3);
  })

  it("Should get current user address as owner", async function () {
    const [owner, p2, p3] = await ethers.getSigners()
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.owner()).equals(owner.address);
  })

  it("Initial balance of owner is 3", async function() {
    const [owner, p2, p3] = await ethers.getSigners()
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.balanceOf(owner.address)).equals(3);
  })

  it("Transfer ok", async function () {
    const [sender, reciever, p3] = await ethers.getSigners()
    const contract = await ethers.deployContract("DiscreteBean", [3]);

    expect(await contract.balanceOf(sender.address)).equals(3);

    //contract invoke is the sender
    await contract.transfer(reciever.address, 1);
    expect(await contract.balanceOf(reciever.address)).equals(1);
    expect(await contract.balanceOf(sender.address)).equals(2);
  })

  it("Transfer bad if insufficient fund", async function () {
    const [sender, reciever, p3] = await ethers.getSigners()
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    
    expect(await contract.balanceOf(sender.address)).equals(3);

    //contract invoke is the sender
    expect(contract.transfer(reciever.address, 4)).to.be.revertedWithCustomError(contract, "ERC20InsufficientBalance").withArgs(sender.address, 3, 4);
  })
  
  //Test approve + transferFrom (the delegated-spending flow)
  it("Transfer on behalf ok", async function () {
    const [sender, defi_swap, reciever] = await ethers.getSigners();
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.balanceOf(sender.address)).equals(3)
    expect(await contract.balanceOf(reciever.address)).equals(0)
    
    //the one invoking is the sender
    await contract.approve(defi_swap.address, 1); //sender allowes defi_swap to send 1 bean on his behalf
    expect(await contract.allowance(sender ,defi_swap)).equals(1)

    await contract.connect(defi_swap).transferFrom(sender.address, reciever.address, 1); //defi_swap calls transferFrom to move sender bean to receiver

    expect(await contract.balanceOf(sender.address)).equals(2)
    expect(await contract.balanceOf(reciever.address)).equals(1)
  })

  it("Transfer on behalf bad if insufficient fund", async function () {
    const [sender, defi_swap, reciever] = await ethers.getSigners();
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.balanceOf(sender.address)).equals(3)
    expect(await contract.balanceOf(reciever.address)).equals(0)
    
    //the one invoking is the sender
    await contract.approve(defi_swap.address, 1); //sender allowes defi_swap to send 1 bean on his behalf
    expect(await contract.allowance(sender ,defi_swap)).equals(1)

    //defi_swap wants to transfer more than what sender has allowed it to
    expect(contract.connect(defi_swap).transferFrom(sender.address, reciever.address, 2)).to.be.revertedWithCustomError(contract, "ERC20InsufficientAllowance"); 

    //balance remains the same
    expect(await contract.balanceOf(sender.address)).equals(3)
    expect(await contract.balanceOf(reciever.address)).equals(0)
  })

  //Test burn
  it("Burn ok", async function() {
    const [p1, _] = await ethers.getSigners();
    const contract = await ethers.deployContract("DiscreteBean", [3]);
    expect(await contract.totalSupply()).equals(3);
    expect(await contract.balanceOf(p1.address)).equals(3);
    
    await contract.burn(2);

    expect(await contract.balanceOf(p1.address)).equals(1);
    expect(await contract.totalSupply()).equals(1);
  })

  it("Burn bad if insufficient fund", async function () {
    const [p1, _] = await ethers.getSigners();
    const contract = await ethers.deployContract("DiscreteBean", [3]);

    expect(await contract.balanceOf(p1.address)).equals(3);
    await expect(contract.burn(4)).to.be.revertedWithCustomError(contract, "ERC20InsufficientBalance");
  })

  it("Anyone can burn", async function () {
    const [p1, p2] = await ethers.getSigners();
    const contract = await ethers.deployContract("DiscreteBean", [3]);

    await contract.transfer(p2.address, 1);
    expect(await contract.balanceOf(p1.address)).equals(2);
    expect(await contract.balanceOf(p2.address)).equals(1);
    expect(await contract.totalSupply()).equals(3);

    await contract.burn(1); //p1 burn 1 bean
    await contract.connect(p2).burn(1); //p2 burn 1 bean

    expect(await contract.balanceOf(p1.address)).equals(1);
    expect(await contract.balanceOf(p2.address)).equals(0);
    expect(await contract.totalSupply()).equals(1);
  })
  
  //Test ownership transfer
  it("Ownership transfer ok", async function () {
    const [owner, nextOwner, _] = await ethers.getSigners();
    const contract = await ethers.deployContract("DiscreteBean", [3]);

    expect(await contract.owner()).equals(owner.address);

    await contract.transferOwnership(nextOwner.address)

    expect(await contract.owner()).equals(nextOwner.address);
  })

});
