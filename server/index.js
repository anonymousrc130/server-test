import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { setTimeout } from "timers/promises";
import ExcelJS from "exceljs";
import { connect } from "puppeteer-real-browser";

puppeteer.use(StealthPlugin());

// Retrieve command-line arguments
const args = process.argv.slice(2);
const startPage = parseInt(args[0], 10);
const maxPage = parseInt(args[1], 10);

async function main(startPage, maxPage) {
  const response = await connect({
    headless: "auto",
    turnstile: true,
  });

  const { page, browser, setTarget } = response;

  try {
    await page.goto("https://dexscreener.com/solana");
    await setTimeout(5000);

    await setTarget({ status: false });

    let page2 = await browser.newPage();
    await setTarget({ status: true });
    await page2.close();

    let resultProject = [];

    for (let i = startPage; i <= maxPage; i++) {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`https://dexscreener.com/solana/page-${i}`, {
        waitUntil: "domcontentloaded",
      });

      await setTimeout(1000);

      const projects = await page.evaluate(() => {
        const projectsItemsSelector = document.querySelectorAll(
          "a.ds-dex-table-row.ds-dex-table-row-top"
        );

        const data = Array.from(projectsItemsSelector).map((item, index) => {
          const urlSelector = item.getAttribute("href");
          const nameSelector = item.querySelector(
            "span.ds-dex-table-row-base-token-symbol"
          );
          const liquiditySelector = item.querySelector(
            "a > div.ds-table-data-cell:nth-child(10)"
          );

          const urlResult = urlSelector ? urlSelector : null;
          const name = nameSelector ? nameSelector.textContent : null;
          const liqudity = liquiditySelector
            ? liquiditySelector.textContent
            : null;

          const url = "https://dexscreener.com" + urlResult;

          let liquidity = null;
          if (liqudity) {
            if (liqudity.endsWith("K")) {
              liquidity =
                parseFloat(liqudity.replace("$", "").replace("K", "")) * 1000;
            } else if (liqudity.endsWith("M")) {
              liquidity =
                parseFloat(liqudity.replace("$", "").replace("M", "")) *
                1000000;
            } else {
              liquidity = parseFloat(
                liqudity.replace("$", "").replace(/,/g, "")
              );
            }
          }
          const liquidityMin30k = liquidity && liquidity > 30000;

          let formattedLiquidity = null;
          if (liquidity !== null) {
            if (liquidity >= 1000000) {
              formattedLiquidity = `$${(liquidity / 1000000).toFixed(1)}M`;
            } else if (liquidity >= 1000) {
              formattedLiquidity = `$${(liquidity / 1000).toFixed(0)}K`;
            } else {
              formattedLiquidity = `$${liquidity.toFixed(1)}`;
            }
          }

          return {
            index: index + 1,
            url,
            name,
            liquidity: formattedLiquidity,
            liquidityMin30k,
          };
        });

        return data.filter((item) => item.liquidityMin30k);
      });
      resultProject.push(...projects);
    }

    const dataArray = [];
    for (let item of resultProject) {
      await page.goto(item.url, { waitUntil: "domcontentloaded" });
      await setTimeout(500);

      const topTraderSelector = "div.custom-78fucf > button:nth-child(3)";
      await page.waitForSelector(topTraderSelector);
      await page.click(topTraderSelector);
      await setTimeout(500);

      const pullUpDataSelector =
        "div.custom-1275zxc > div.custom-xeho74 > button:nth-child(2)";
      await page.waitForSelector(pullUpDataSelector);
      await page.click(pullUpDataSelector);
      await setTimeout(500);

      const pageData = await page.evaluate(() => {
        const items = document.querySelectorAll("div.custom-fia8gz");
        const projectNameSelector = document.querySelector(
          "h2 > span.chakra-text.custom-fhd7ki > span"
        );

        const projectName = projectNameSelector
          ? projectNameSelector.textContent.trim()
          : null;

        const data = Array.from(items)
          .map((item, index) => {
            const addresSelector = item.querySelector(
              "a.chakra-link.chakra-button.custom-1hhf88o"
            );
            const txnsSelector = item.querySelector(
              "div:nth-child(3) > span.chakra-text.custom-13ppmr2 > span:nth-child(3)"
            );

            const pnlSelector = item.querySelector("div.custom-1e9y0rl");
            const boughtValueSelector = item.querySelector(
              "span.chakra-text.custom-rcecxm"
            );

            const address = addresSelector
              ? addresSelector
                  .getAttribute("href")
                  .replace("https://solscan.io/account/", "")
              : null;

            const boughtTotal = boughtValueSelector
              ? boughtValueSelector.textContent
              : null;
            const pnl = pnlSelector ? pnlSelector.textContent : null;

            let boughtValue = null;
            if (boughtTotal) {
              if (boughtTotal.endsWith("K")) {
                boughtValue = parseFloat(
                  boughtTotal.replace("$", "").replace("K", "")
                ) * 1000;
              } else if (boughtTotal.endsWith("M")) {
                boughtValue = parseFloat(
                  boughtTotal.replace("$", "").replace("M", "")
                ) * 1000000;
              } else {
                boughtValue = parseFloat(
                  boughtTotal.replace("$", "").replace(/,/g, "").replace("$", "")
                );
              }
            }

            let pnlValue = null;
            if (pnl) {
              if (pnl.endsWith("K")) {
                pnlValue = parseFloat(pnl.replace("$", "").replace("K", "")) * 1000;
              } else if (pnl.endsWith("M")) {
                pnlValue = parseFloat(pnl.replace("$", "").replace("M", "")) * 1000000;
              } else {
                pnlValue = parseFloat(pnl.replace("$", "").replace(/,/g, "").replace("$", ""));
              }
            }

            const profit2xInvestment = pnlValue >= boughtValue * 2;

            const formatNumber = (num) => {
              if (num >= 1000000) {
                return `$${(num / 1000000).toFixed(1)}M`;
              } else if (num >= 1000) {
                return `$${(num / 1000).toFixed(0)}K`;
              } else {
                return `$${num.toFixed(1)}`.replace('.0', '');
              }
            };

            const formattedBoughtTotal = boughtValue !== null ? formatNumber(boughtValue) : null;
            const formattedPnl = pnlValue !== null ? formatNumber(pnlValue) : null;

            const addressUrl = addresSelector ? addresSelector.getAttribute('href') : null;
            const txns = txnsSelector ? txnsSelector.textContent : null;

            return {
              address,
              txns,
              projectName,
              addressUrl,
              pnl: formattedPnl,
              boughtTotal: formattedBoughtTotal,
              profit2xInvestment,
            };
          })
          .filter((item) => item.txns == "1" && item.profit2xInvestment);
        return {
          data,
          projectName,
        };
      });
      dataArray.push(pageData);
    }

    await saveToExcel(dataArray, "result");

    await browser.close();
  } catch (error) {
    console.log(error);
  }
}

// Function to save data to Excel file with dynamic file name
async function saveToExcel(dataArray, fileName) {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Projects");

    // Define headers for the worksheet
    sheet.columns = [
      { header: "Project Name", key: "projectName", width: 20 },
      { header: "Address Wallet", key: "addressUrl", width: 40 },
      { header: "Address", key: "address", width: 40 },
      { header: "Investment", key: "boughtTotal", width: 10 },
      { header: "Profit", key: "pnl", width: 10 },
      { header: "Transactions", key: "txns", width: 10 },
    ];

    // Add rows to the worksheet
    dataArray.forEach((pageData) => {
      pageData.data.forEach((item) => {
        sheet.addRow({
          projectName: item.projectName,
          addressUrl: item.addressUrl,
          address: item.address,
          boughtTotal: item.boughtTotal,
          pnl: item.pnl,
          txns: item.txns,
        });
      });
    });

    // Save workbook to a file with dynamic name
    const finalFileName = `${fileName}.xlsx`;
    await workbook.xlsx.writeFile(finalFileName);
    console.log(`Excel file saved: ${finalFileName}`);
  } catch (error) {
    console.log("Error saving to Excel:", error);
  }
}

// Run the main function with command-line arguments
main(startPage, maxPage).catch(console.error);
