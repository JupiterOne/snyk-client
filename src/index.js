const request = require('request-promise-native');
const { retry } = require('@lifeomic/attempt');
const SNYK_API_BASE = 'https://snyk.io/api/v1/';

class SnykClient {
  /**
   * @constructor
   * @param {string} apiKey - Snyk API key
   * @param {Object} [options]
   * @param {number} [options.retries=5]
   */
  constructor (apiKey, options) {
    if (!apiKey) {
      throw new Error('API key must be defined');
    }

    this.apiKey = apiKey;
    this.retries = options?.retries || 5;

    this._request = request.defaults({
      baseUrl: SNYK_API_BASE,
      headers: {
        'Authorization': `token ${this.apiKey}`
      },
      json: true
    });
  }


  /**
   * Snyk API wrapper
   * Will throw an error if one returned by Snyk
   * @param args - Arguments to the request function
   * @returns {Object} response - API response object
   */
  async snykRequest (...args) {
    const response = await this._request(...args);

    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  }


  async verifyAccess (orgId) {
    return this.snykRequest({
      method: 'GET',
      uri: `org/${orgId}/members`,
    });
  }




  /**
   * "Imports projects into an integration"
   * @param {string} orgId - Organization ID
   * @param {string} integrationId - integrationId
   * @param {string} projOwner - id of repo owner
   * @param {string} projName - name of repo
   * @param {string} projBranch - branch to import
   * @returns {Object} response - API response object
   */
  async importProject (orgId, integrationId, projOwner, projName, projBranch) { 
    return this.snykRequest({
      method: 'POST',
      uri: `org/${orgId}/integrations/${integrationId}/import`,
      body: {
        target: {
          owner: projOwner,
          name: projName,
          branch: projBranch
        }
      }
    });
  }


  /**
   * "Gets Results of an Imported Project"
   * @param {string} orgId - Organization ID
   * @param {string} integrationId - integrationId
   * @param {string} jobId - job ID
   * @returns {Object} job - object representing the job
   */
  async importProjectResults (orgId, integrationId, jobId) { 
    return this.snykRequest({
      method: 'POST',
      uri: `org/${orgId}/integrations/${integrationId}/import/${jobId}`
    });
  }


  /**
   * "List All The Projects in the Organization"
   * @param {string} orgId - Organization ID
   * @returns {Object} orgs - object representing the organization
   * @returns {Object} projects - object representing the list of projects
   */
  async listAllProjects(orgId) { 
    return retry(
      async () => {
        return this.snykRequest({
          method: 'GET',
          uri: `org/${orgId}/projects`
        });
      },
      {
        delay: 5000,
        factor: 1.2,
        maxAttempts: this.retries,
        handleError(err, context) {
          const code = err.statusCode;
          if (code !== 429 || code >= 500) {
            context.abort();
          }
        },
      },
    );
  }


  /**
   * "List All The Organisations A User Belongs To"
   * @returns {Object} orgs - object representing the list of organizations for the account
   */
  async listOrgs () {
    return this.snykRequest({
      method: 'GET',
      uri: 'orgs'
    });
  }


  /**
   * "List All Issues"
   * @param {string} orgId - Organization ID
   * @param {string} projectId - Project ID
   * @param {Object} filters - Object with filters
   * @returns {Object} testResult - object representing the list of issues
   * @deprecated Please use `listAggregatedIssues` per Snyk API Docs: https://snyk.docs.apiary.io/#reference/projects/project-issues/list-all-issues-deprecated
   */
  async listIssues (orgId, projectId, filters = {}) {
    return retry(
      async () => {
        return this.snykRequest({
          method: 'POST',
          uri: `/org/${orgId}/project/${projectId}/issues`,
          body: filters
        });
      },
      {
        delay: 5000,
        factor: 1.2,
        maxAttempts: this.retries,
        handleError(err, context) {
          const code = err.statusCode;
          if (code !== 429 || code >= 500) {
            context.abort();
          }
        },
      },
    );
  }


  /**
   * "List All Aggregated Issues"
   * @param {string} orgId - Organization ID
   * @param {string} projectId - Project ID
   * @param {Object} filters - Object with filters
   * @returns {Object} object representing the list of issues
   */
   async listAggregatedIssues (orgId, projectId, filters = {}) {
    return retry(
      async () => {
        return this.snykRequest({
          method: 'POST',
          uri: `/org/${orgId}/project/${projectId}/aggregated-issues`,
          body: filters
        });
      },
      {
        delay: 5000,
        factor: 1.2,
        maxAttempts: this.retries,
        handleError(err, context) {
          const code = err.statusCode;
          if (code !== 429 || code >= 500) {
            context.abort();
          }
        },
      },
    );
  }


  /**
   * "Test `package.json` File"
   * @param {string} orgId - "The organisation to test the package with"
   * @param {string} target - Contents of the primary manifest
   * @returns {Object} testResult - object representing the list of issues
   */
  async testNpmFile (orgId, target) {
    return this.snykRequest({
      method: 'POST',
      uri: 'test/npm',
      query: {
        org: orgId
      },
      body: {
        // TODO: hardcoded
        encoding: 'plain',
        files: {
          target: {
            contents: target
          }
        }
      }
    });
  }

}


module.exports = SnykClient;