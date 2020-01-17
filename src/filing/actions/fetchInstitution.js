import fetchCurrentFiling from './fetchCurrentFiling.js'
import receiveInstitution from './receiveInstitution.js'
import receiveError from './receiveError.js'
import hasHttpError from './hasHttpError.js'
import { getInstitution } from '../api/api.js'
import requestInstitution from './requestInstitution.js'
import { error } from '../utils/log.js'
import receiveNonQFiling from './receiveNonQFiling'
import { splitYearQuarter } from '../api/utils'

export default function fetchInstitution(institution, filingPeriod, filingQuarters, fetchFilings = true) {
  return dispatch => {
    dispatch(requestInstitution(institution.lei))
    return getInstitution(institution.lei, filingPeriod)
      .then(json => {
        return hasHttpError(json).then(hasError => {
          if (hasError) {
            dispatch(receiveError(json))
            throw new Error(json && `${json.status}: ${json.statusText}`)
          }

          dispatch(receiveInstitution(json))

          if(fetchFilings) {
            const isQuarterly = splitYearQuarter(filingPeriod)[1]
            return isQuarterly && !json.institution.quarterlyFiler
              ? dispatch(receiveNonQFiling(json))
              : dispatch(fetchCurrentFiling(json, filingQuarters))
          }
        })
      })
      .catch(err => {
        error(err)
      })
  }
}