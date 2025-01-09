import * as bases from "~tabs/bases"
import { ProfileData } from "~util/components/profile"

export const Profile = () => {
    return (
        <bases.Authenticated>
            <ProfileData />
        </bases.Authenticated>
    )
}
