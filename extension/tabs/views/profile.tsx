import * as navigation from "~tabs/navigation"
import { ProfileData } from "~util/components/profile"

export const ProfileView = () => {
    return (
        <navigation.TabsNavigation>
            <ProfileData />
        </navigation.TabsNavigation>
    )
}
