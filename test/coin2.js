"use strict"

var MegaCoin = artifacts.require("./MegaCoin.sol");
const theBN = require("bn.js")

/**
 * MegaCoin contract tests 2
 */
contract('MegaCoin2', function(accounts) {
  const BIG = (v) => new theBN.BN(v)

  const owner = accounts[0];
  const admin = accounts[1];
  const vault = accounts[2];
  const minter = accounts[0];

  const user1 = accounts[4];
  const user2 = accounts[5];
  const user3 = accounts[6];
  const user4 = accounts[7];
  const user5 = accounts[8];

  let coin, OneMegaCoinInMinunit, NoOfTokens, NoOfTokensInMinunit;

  const bnBalanceOf = async addr => await coin.balanceOf(addr);
  const bnReserveOf = async addr => await coin.reserveOf(addr);
  const bnAllowanceOf = async (owner, spender) => await coin.allowance(owner, spender);

  const balanceOf = async addr => (await coin.balanceOf(addr)).toString();
  const reserveOf = async addr => (await coin.reserveOf(addr)).toString();
  const allowanceOf = async (owner, spender) => (await coin.allowance(owner,spender)).toString();


  before(async () => {
    coin = await MegaCoin.deployed();
    NoOfTokensInMinunit = await coin.totalSupply();
    OneMegaCoinInMinunit = await coin.getOneMegaCoin();
    NoOfTokens = NoOfTokensInMinunit.div(OneMegaCoinInMinunit)
  });

  const clearUser = async user => {
    await coin.setReserve(user, 0, {from: admin});
    await coin.transfer(vault, await bnBalanceOf(user), {from: user});
  };

  beforeEach(async () => {
    await clearUser(user1);
    await clearUser(user2);
    await clearUser(user3);
    await clearUser(user4);
    await clearUser(user5);
  });

  it("reserve and then approve", async() => {
    assert.equal(await balanceOf(user4), "0");

    const OneMegaTimesTwoInMinunit = OneMegaCoinInMinunit.mul(BIG(2))
    const OneMegaTimesTwoInMinunitStr = OneMegaTimesTwoInMinunit.toString()

    const OneMegaTimesOneInMinunit = OneMegaCoinInMinunit.mul(BIG(1))
    const OneMegaTimesOneInMinunitStr = OneMegaTimesOneInMinunit.toString()

    // send 2 Mega to user4 and set 1 Mega reserve
    coin.transfer(user4, OneMegaTimesTwoInMinunit, {from: vault});
    coin.setReserve(user4, OneMegaCoinInMinunit, {from: admin});
    assert.equal(await balanceOf(user4), OneMegaTimesTwoInMinunitStr);
    assert.equal(await reserveOf(user4), OneMegaCoinInMinunit.toString());

    // approve 2 Mega to user5
    await coin.approve(user5, OneMegaTimesTwoInMinunit, {from:user4});
    assert.equal(await allowanceOf(user4, user5), OneMegaTimesTwoInMinunitStr);

    // transfer 2 Mega from user4 to user5 SHOULD NOT BE POSSIBLE
    try {
      await coin.transferFrom(user4, user5, OneMegaTimesTwoInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    // transfer 1 Mega from user4 to user5 SHOULD BE POSSIBLE
    await coin.transferFrom(user4, user5, OneMegaTimesOneInMinunit, {from: user5});
    assert.equal(await balanceOf(user4), OneMegaTimesOneInMinunitStr);
    assert.equal(await reserveOf(user4), OneMegaTimesOneInMinunitStr); // reserve will not change
    assert.equal(await allowanceOf(user4, user5), OneMegaTimesOneInMinunitStr); // allowance will be reduced
    assert.equal(await balanceOf(user5), OneMegaTimesOneInMinunitStr);
    assert.equal(await reserveOf(user5), "0");

    // transfer .5 Mega from user4 to user5 SHOULD NOT BE POSSIBLE if balance <= reserve
    const halfMegaInMinunit = OneMegaCoinInMinunit.div(BIG(2));
    try {
      await coin.transferFrom(user4, user5, halfMegaInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  })

  it("only minter can call mint", async() => {
      const OneMegaTimesTenInMinunit = OneMegaCoinInMinunit.mul(BIG(10))
      const OneMegaTimesTenInMinunitStr = OneMegaTimesTenInMinunit.toString()

      assert.equal(await balanceOf(user4), "0");

      await coin.mint(user4, OneMegaTimesTenInMinunit, {from: minter})

      const totalSupplyAfterMintStr = (await coin.totalSupply()).toString()
      assert.equal(totalSupplyAfterMintStr, OneMegaTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
      assert.equal(await balanceOf(user4), OneMegaTimesTenInMinunitStr);

      try {
          await coin.mint(user4, OneMegaTimesTenInMinunit, {from: user4})
          assert.fail();
      } catch(exception) {
          assert.equal(totalSupplyAfterMintStr, OneMegaTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
          assert.isTrue(exception.message.includes("revert"));
      }
  })

  it("cannot mint above the mint cap", async() => {
      const OneMegaTimes100BilInMinunit = 
              OneMegaCoinInMinunit.mul(BIG(100000000000))

      assert.equal(await balanceOf(user4), "0");


      try {
          await coin.mint(user4, OneMegaTimes100BilInMinunit, {from: minter})
          assert.fail();
      } catch(exception) {
          assert.isTrue(exception.message.includes("revert"));
      }
  })
});
