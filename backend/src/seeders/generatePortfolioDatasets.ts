import { printPipelineSummary, runPortfolioDatasetPipeline } from "../services/portfolioDatasetPipeline.service";

async function main(): Promise<void> {
  const result = await runPortfolioDatasetPipeline();
  printPipelineSummary(result);

  if (result.uploaded.length !== 100 || result.failed.length > 0) {
    throw new Error(`PIPELINE_INCOMPLETE uploaded=${result.uploaded.length} failed=${result.failed.length}`);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
