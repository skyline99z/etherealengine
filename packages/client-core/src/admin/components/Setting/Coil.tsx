import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { AuthState } from '../../../user/services/AuthService'
import { AdminCoilSettingService, AdminCoilSettingsState } from '../../services/Setting/CoilSettingService'
import styles from '../../styles/settings.module.scss'

const Coil = () => {
  const { t } = useTranslation()
  const coilSettingState = useHookstate(getMutableState(AdminCoilSettingsState))
  const [coil] = coilSettingState?.coil?.get({ noproxy: true }) || []

  const user = useHookstate(getMutableState(AuthState).user)

  useEffect(() => {
    if (user?.id?.value && coilSettingState?.updateNeeded?.value) {
      AdminCoilSettingService.fetchCoil()
    }
  }, [user?.id?.value, coilSettingState?.updateNeeded?.value])

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.coil')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={6} sm={6}>
          <InputText
            name="clientId"
            label={t('admin:components.setting.clientId')}
            value={coil?.clientId || ''}
            disabled
          />

          <InputText
            name="clientSecret"
            label={t('admin:components.setting.clientSecret')}
            value={coil?.clientSecret || ''}
            disabled
          />
        </Grid>
        <Grid item xs={6} sm={6}>
          <InputText
            name="paymentPointer"
            label={t('admin:components.setting.coilPaymentPointer')}
            value={coil?.paymentPointer || ''}
            disabled
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default Coil
