import React, { Component } from 'react'
import { connect } from 'react-redux'
import requestInstitutions from '../actions/requestInstitutions.js'
import fetchEachInstitution from '../actions/fetchEachInstitution.js'
import receiveInstitutions from '../actions/receiveInstitutions.js'
import Institutions from './index.jsx'
import { getKeycloak } from '../utils/keycloak.js'

export class InstitutionContainer extends Component {
  componentDidMount() {
    this.fetchIfNeeded()
  }

  componentDidUpdate(){
    this.fetchIfNeeded()
  }

  fetchIfNeeded() {
    const { dispatch, filingPeriod, institutions } = this.props
    if (!institutions.fetched && !institutions.isFetching){
      dispatch(requestInstitutions())
      const leiString = getKeycloak().tokenParsed.lei
      const leis = leiString ? leiString.split(',') : []

      // create the expected objects from the array, institutions = [{lei: lei}]
      let instArr = []
      leis.forEach(lei => {
        instArr.push({ lei: lei })
      })

      dispatch(fetchEachInstitution(instArr, filingPeriod))
      dispatch(receiveInstitutions())
    }
  }

  render() {
    return <Institutions {...this.props} />
  }
}

export function mapStateToProps(state, ownProps) {
  const { institutions, filings, submission, latestSubmissions, error } = state.app
  const { filingPeriod } = ownProps.match.params
  const filingYears = ownProps.config.filingPeriods

  return {
    submission,
    filingPeriod,
    filingYears,
    institutions,
    filings,
    error,
    latestSubmissions: latestSubmissions.latestSubmissions
  }
}

export default connect(mapStateToProps)(InstitutionContainer)
