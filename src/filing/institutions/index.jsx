import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Loading from '../../common/LoadingIcon.jsx'
import ErrorWarning from '../common/ErrorWarning.jsx'
import Institution from './Institution.jsx'
import InstitutionsHeader from './Header.jsx'
import sortInstitutions from '../utils/sortInstitutions.js'
import FilingPeriodSelector from '../common/FilingPeriodSelector'
import Alert from '../../common/Alert.jsx'

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

  const showingQuarterly = filingPeriod.indexOf('Q') > -1
  const nonQuarterlyInstitutions = []
  const showSummary = false

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

      // Handle non-quarterly filers
      if (showingQuarterly && !institution.quarterlyFiler){ 
        nonQuarterlyInstitutions.push(institution.lei)
        nonQuarterlyInstitutions.push(institution.lei)
        if (showSummary) return null
        return (
          <section className='institution'>
            <div className='current-status'>
            <h3>{institution.lei}</h3>
              <section className='status'>
                This institution is not a quarterly filer.
              </section>
            </div>
          </section>
        )
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
  }).filter(x => x)

  if (filteredInstitutions.length === 0 && showingQuarterly)
    return (
      <Alert heading='No associated quarterly filing institutions' type='info'>
        <p>
          None of your associated institutions are registered as quarterly filers for this year.
          Please use&nbsp;
          <a href='https://hmdahelp.consumerfinance.gov/accounthelp/'>
            this form
          </a>{' '}
          and enter the necessary information, including your HMDA Platform
          account email address in the &#34;Additional comments&#34; text box.
          We will apply the update to your account, please check back 2 business
          days after submitting your information.
        </p>
      </Alert>
    )

  if(showingQuarterly && nonQuarterlyInstitutions.length && showSummary){
    const ineligible = (
      <section className='institution'>
        <div className='current-status'>
          <h3>The following institutions are not quarterly filers</h3>
          <section className='status'>
            <ul style={{listStyleType: 'disc', paddingLeft: '20px'}}>
              {nonQuarterlyInstitutions.map(i => <li key={i}>{i}</li>)}
            </ul>
            
          </section>
        </div>
      </section>
    )
    filteredInstitutions.push(ineligible)
  }
  
  return filteredInstitutions
}

export default class Institutions extends Component {
  render() {
    const { error, filingPeriod, filingYears, location } = this.props

    return (
      <main id="main-content" className="Institutions full-width">
        {error ? <ErrorWarning error={error} /> : null}
        <div className="usa-width-one-whole">
          {filingPeriod ? (
            <InstitutionsHeader filingPeriod={filingPeriod} />
          ) : null}

          <FilingPeriodSelector
            years={filingYears}
            filingPeriod={filingPeriod}
            pathname={location.pathname}
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
