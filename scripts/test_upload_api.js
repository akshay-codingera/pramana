// scripts/test_upload_api.js
// Test upload_predict, ground_truth, and experiments endpoints

const http = require('http');

const sampleJudgment = `
IN THE SUPREME COURT OF INDIA
CIVIL APPELLATE JURISDICTION
CIVIL APPEAL NO. 9988 OF 2024

APPELLANT: RAMESHWAR PRASAD & ANR.
VERSUS
RESPONDENT: STATE OF RAJASTHAN & ORS.

1. This appeal by special leave arises from the final judgment and order dated 14.07.2023 passed by the High Court of Judicature for Rajasthan in D.B. Civil Special Appeal No. 450 of 2021, whereby the High Court affirmed the judgment of the learned Single Judge dismissing the writ petition.

2. The appellants were appointed as Assistant Revenue Inspectors on an ad-hoc basis in the year 1998 pursuant to a departmental notification. Their services were regularized in 2004 following a statutory screening committee review. The grievance raised by the appellants pertains to the computation of their seniority and pensionary benefits with effect from their initial ad-hoc induction.

3. Learned senior counsel appearing on behalf of the appellants contended that continuous uninterrupted officiating service prior to regularisation must be counted for seniority when the appointment was against sanctioned substantive vacancies. Reliance was placed on the Constitution Bench judgment of this Court in Direct Recruit Class II Engineering Officers' Association v. State of Maharashtra (1990) 2 SCC 715.

4. Opposing the appeal, learned Additional Advocate General appearing for the State submitted that the initial appointments were purely stop-gap arrangements made without following the statutory recruitment rules. Consequently, Rule 24 of the Rajasthan Subordinate Revenue Service Rules strictly debars ad-hoc tenure from being counted towards cadre seniority.

5. We have given our anxious consideration to the rival submissions and examined the service records placed before us. It is an established principle that officiating service can only count if the initial entry was through a regular selection process complying with Articles 14 and 16 of the Constitution. Here, the initial induction was by way of local arrangement without public advertisement.

6. In view of the above settled legal principles, we find no jurisdictional infirmity or perversity in the findings recorded by the High Court. The appeal is devoid of merit.
`;

function makePost(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makeGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log("=== 1. Testing POST /api/upload_predict with Unseen Judgment ===");
  const predRes = await makePost('/api/upload_predict', {
    filename: 'Civil_Appeal_9988_2024.txt',
    text: sampleJudgment,
    model: 'hierarchical'
  });
  console.log("Status:", predRes.status);
  console.log("Experiment ID:", predRes.body.experiment_id);
  console.log("Predicted Outcome:", predRes.body.predicted_outcome);
  console.log("P(Allowed):", predRes.body.prob_allowed);
  console.log("P(Dismissed):", predRes.body.prob_dismissed);
  console.log("Confidence:", predRes.body.confidence);
  console.log("Top-1 Influential Passage delta P:", predRes.body.top_passages[0].delta_probability);
  console.log("Warnings:", predRes.body.verdict_warnings);

  const expId = predRes.body.experiment_id;

  console.log("\n=== 2. Testing POST /api/ground_truth ===");
  const gtRes = await makePost('/api/ground_truth', {
    experiment_id: expId,
    ground_truth: 'DISMISSED'
  });
  console.log("Status:", gtRes.status);
  console.log("Prediction Correct:", gtRes.body.updated_experiment.is_correct);
  console.log("Cumulative Accuracy:", gtRes.body.cumulative_evaluation.accuracy, "%");
  console.log("Confusion Matrix:", JSON.stringify(gtRes.body.cumulative_evaluation.confusion_matrix));

  console.log("\n=== 3. Testing GET /api/experiments ===");
  const listRes = await makeGet('/api/experiments');
  console.log("Status:", listRes.status);
  console.log("Total Experiments:", listRes.body.experiments.length);
  console.log("Summary:", JSON.stringify(listRes.body.evaluation_summary));
}

run().catch(console.error);
