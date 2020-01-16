import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Loading from '../../common/LoadingIcon.jsx'
import ErrorWarning from '../common/ErrorWarning.jsx'
import Institution from './Institution.jsx'
import InstitutionsHeader from './Header.jsx'
import sortInstitutions from '../utils/sortInstitutions.js'
import InstitutionPeriodSelector from './InstitutionPeriodSelector'
import Alert from '../../common/Alert.jsx'
import { NonQuarterlyInstitutions } from './NonQuarterlyInstitutions'
import { splitYearQuarter } from '../api/utils.js'

import './Institutions.css'

const _setSubmission = (submission, latest, filingObj) => {
  if (
    submission.id &&
    submission.id.lei === filingObj.filing.lei &&
    submission.id.period.year.toString() === filingObj.filing.period
  ) {
    return submission
  }

  return latest
}

const wrapLoading = (i = 0) => {
  return (
    <div key={i} style={{ height: '100px' }}>
      <Loading className="floatingIcon" />
    </div>
  )
}

const _whatToRender = ({ filings, institutions, submission, filingPeriod, latestSubmissions }) => {

  // we don't have institutions yet
  if (!institutions.fetched) return wrapLoading()

  // we don't have any associated institutions
  // This is probably due to accounts from previous years
  if (Object.keys(institutions.institutions).length === 0)
    return (
      <Alert heading="No associated institutions" type="info">
        <p>
          In order to access the HMDA Platform, your institution must have a
          Legal Entity Identifier (LEI). In order to provide your{' '}
          institution&#39;s LEI, please access{' '}
          <a href="https://hmdahelp.consumerfinance.gov/accounthelp/">
            this form
          </a>{' '}
          and enter the necessary information, including your HMDA Platform
          account email address in the &#34;Additional comments&#34; text box.
          We will apply the update to your account, please check back 2 business{' '}
          days after submitting your information.
        </p>
      </Alert>
    )

  // sorted to keep the listing consistent
  const sortedInstitutions = Object.keys(institutions.institutions).sort(
    sortInstitutions
  )

  const [filingYear, showingQuarterly] = splitYearQuarter(filingPeriod)
  const nonQuarterlyInstitutions = []

  const filteredInstitutions = sortedInstitutions.map((key,i) => {
    const institution = institutions.institutions[key]
    const institutionFilings = filings[institution.lei]
    const institutionSubmission = latestSubmissions[institution.lei]

    if (
      !institutionFilings || !institutionFilings.fetched ||
      !institutionSubmission || institutionSubmission.isFetching
    ) {
      // latest submission or filings are not fetched yet
      return wrapLoading(i)
    } else {
      // we have good stuff

      if (showingQuarterly && !institution.quarterlyFiler){
        nonQuarterlyInstitutions.push(institution)
        return null
      }

      const filingObj = institutionFilings.filing
      return (
        <Institution
          key={i}
          filing={filingObj.filing}
          institution={institution}
          submission={_setSubmission(submission, institutionSubmission, filingObj)}
          submissions={filingObj.submissions}
        />
      )
    }
  })

  if (showingQuarterly) {
    if (!filteredInstitutions.length)
      return (
        <Alert heading='No quarterly filing institutions' type='info'>
          <p>
            None of your associated institutions are registered as quarterly
            filers for {filingYear}.
          </p>
        </Alert>
      )

    filteredInstitutions.push(
      <NonQuarterlyInstitutions key='nq' list={nonQuarterlyInstitutions} />
    )
  }

  return filteredInstitutions
}

export default class Institutions extends Component {
  render() {
    const { error, filingPeriod, filingPeriods, history, location, dispatch } = this.props

    return (
      <main id="main-content" className="Institutions full-width">
        {error ? <ErrorWarning error={error} /> : null}
        <div className="usa-width-one-whole">
          {filingPeriod ? (
            <InstitutionsHeader filingPeriod={filingPeriod} />
          ) : null}

          <InstitutionPeriodSelector
            filingPeriods={filingPeriods}
            filingPeriod={filingPeriod}
            history={history}
            pathname={location.pathname}
            dispatch={dispatch}
          />

          {_whatToRender(this.props)}

          {this.props.institutions.fetched &&
          Object.keys(this.props.institutions.institutions).length !== 0 ? (
            <Alert
              heading="Missing an institution?"
              type="info"
              headingType="small"
            >
              <p className="text-small">
                In order to access the HMDA Platform, each of your institutions
                must have a Legal Entity Identifier (LEI). In order to provide
                your institution&#39;s LEI, please access{' '}
                <a href="https://hmdahelp.consumerfinance.gov/accounthelp/">
                  this form
                </a>{' '}
                and enter the necessary information, including your HMDA
                Platform account email address in the &#34;Additional
                comments&#34; text box. We will apply the update to your
                account, please check back 2 business days after submitting your
                information.
              </p>
            </Alert>
          ) : null}
        </div>
      </main>
    )
  }
}

Institutions.propTypes = {
  submission: PropTypes.object,
  error: PropTypes.object,
  filings: PropTypes.object,
  filingPeriod: PropTypes.string,
  institutions: PropTypes.object
}
