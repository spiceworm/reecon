import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import Badge, { badgeClasses } from "@mui/material/Badge"
import IconButton from "@mui/material/IconButton"
import { styled } from "@mui/material/styles"
import Tooltip, { tooltipClasses, type TooltipProps } from "@mui/material/Tooltip"

export const CopyToClipboardButton = ({ text }) => {
    return (
        <Tooltip title="Copy to clipboard">
            <IconButton>
                <ContentCopyIcon
                    fontSize={"small"}
                    onClick={async () => {
                        await navigator.clipboard.writeText(text)
                    }}
                />
            </IconButton>
        </Tooltip>
    )
}

export const EmptyBadge = styled(Badge)`
    & .${badgeClasses.badge} {
        top: -12px;
        right: -6px;
    }
`

const NoMaxWidthTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: "none"
    }
})

export const TooltipIcon = ({ icon, title }) => {
    return (
        <NoMaxWidthTooltip title={title}>
            <IconButton disableTouchRipple={true} style={{ backgroundColor: "transparent", cursor: "default" }}>
                {icon}
            </IconButton>
        </NoMaxWidthTooltip>
    )
}
