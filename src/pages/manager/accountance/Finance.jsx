import ManagerLayout from '../../../layouts/ManagerLayout'
import { AccountanceFinanceContent } from '../../accountance/Finance'

export default function FinanceForManager() {
  return (
    <ManagerLayout>
      <AccountanceFinanceContent isManager={true} />
    </ManagerLayout>
  )
}


