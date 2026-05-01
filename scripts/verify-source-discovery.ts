import assert from 'node:assert/strict';
import {
	extractDataGovCatalogMetadata,
	extractPdlDiscoveryMetadata
} from '../src/lib/ingestion/source-metadata';

const dataGovFixture = `
<html>
	<body>
		<a href="/apis/d3d3d8bf-e170-4fdc-abc5-1fba050acf44">Catalog API</a>
		<span>Catalog API is not available.</span>
		<a>Zip Download</a>
		<script>
			window.__NUXT__=(function(){return {post:{nid:"6715802",uuid:"d3d3d8bf-e170-4fdc-abc5-1fba050acf44",node_alias:"answers-data-rajya-sabha-questions-session-249",field_group_name:"Rajya Sabha - Annexures to Parliamentary Questions",updated_date:"17\\u002F02\\u002F2025",field_keywords:"rajya sabha, questions"}}})()
		</script>
	</body>
</html>`;

const catalogMetadata = extractDataGovCatalogMetadata(
	dataGovFixture,
	'https://www.data.gov.in/catalog/answers-data-rajya-sabha-questions-session-249'
);

assert.equal(catalogMetadata?.uuid, 'd3d3d8bf-e170-4fdc-abc5-1fba050acf44');
assert.equal(catalogMetadata?.nid, '6715802');
assert.equal(catalogMetadata?.nodeAlias, 'answers-data-rajya-sabha-questions-session-249');
assert.equal(catalogMetadata?.groupName, 'Rajya Sabha - Annexures to Parliamentary Questions');
assert.equal(catalogMetadata?.updatedDate, '17/02/2025');
assert.equal(catalogMetadata?.apiUrl, 'https://www.data.gov.in/apis/d3d3d8bf-e170-4fdc-abc5-1fba050acf44');
assert.equal(catalogMetadata?.catalogApiAvailable, false);
assert.equal(catalogMetadata?.zipDownloadAvailable, true);
assert.deepEqual(catalogMetadata?.keywords, ['rajya sabha', 'questions']);

const pdlFixture = `
<html>
	<body>
		<a href="/handle/123456789/6">Navigation handle</a>
		<div class="discovery-result-results">
		<div class="panel-heading">Results 1-5 of 114 (Search time: 0.051 seconds).</div>
		<span class="title-field">Motion for the consideration of the Citizenship (Amendment) Bill, 2019.</span>
		<a href="/handle/123456789/1043787?view_type=search">View...</a>
		<a href="/bitstream/123456789/1043787/1/4102.pdf">PDF</a>
		</div>
		<a href="/simple-search?filtername=debate&amp;filterquery=GOVERNMENT+BILLS&amp;filtertype=equals">GOVERNMENT BILLS</a>
		<a href="/simple-search?filtername=loksabhanumber&amp;filterquery=17&amp;filtertype=equals">17</a>
	</body>
</html>`;

const pdlMetadata = extractPdlDiscoveryMetadata(pdlFixture, 'https://eparlib.sansad.in/simple-search?query=transcript');

assert.equal(pdlMetadata.resultCount, 114);
assert.deepEqual(pdlMetadata.sampleHandles, ['https://eparlib.sansad.in/handle/123456789/1043787?view_type=search']);
assert.deepEqual(pdlMetadata.sampleBitstreams, ['https://eparlib.sansad.in/bitstream/123456789/1043787/1/4102.pdf']);
assert.deepEqual(pdlMetadata.sampleTitles, ['Motion for the consideration of the Citizenship (Amendment) Bill, 2019.']);
assert.deepEqual(pdlMetadata.facetValues.debate, ['GOVERNMENT BILLS']);
assert.deepEqual(pdlMetadata.facetValues.loksabhanumber, ['17']);

console.log('Source discovery metadata checks passed.');
