/*
 * CopyApp.js
 * Copyright (C) Xerox Corporation, 2010.  All rights reserved.
 *
 * This file provides the help functions for creating a CopyJob ticket.
 *
 * @revision 10/22/2012 TC  Created.
 *           10/30/2013 TC  Updated the Finishing tag in CopyTicket.
 *
 */

/****************************  CONSTANTS  *******************************/

var XRX_JOB_MODEL_NAMESPACE_ESCAPED = 'xmlns=&quot;http://schemas.xerox.com/enterprise/eipjobmodel/1&quot;';



/****************************  VARIABLES  *******************************/

var scaling = { type: 'Proportional',
    scalingProportional: '100',
    scalingX: '100',
    scalingY: '100'
}

var finishing = { punching: 'None',
    stapling: 'None',
    folding: 'None'
}

/****************************  FUNCTIONS  *******************************/

//
// Help functions
//

/**
 * Help function builds the CopyJobTicket.
 */
function xrxCopyJobTicket(inputSides, scaling, finishing, color, collation, copies, outputSides, inputTray) {
    var ticket = '&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;'
        + xrxCreateEscapedTag('CopyJobTicket', XRX_JOB_MODEL_NAMESPACE_ESCAPED,
            xrxCopyJobDescription() + xrxCopyJobProcessing(inputSides, scaling, finishing, color, collation, copies, outputSides, inputTray));
    return ticket;
}

/**
 * Help function used by xrxCopyJobTicket() to build the CopyJobTicket.
 */
function xrxCopyJobDescription()
{
    return xrxCreateEscapedTag('JobDescription', '', '');
}

/**
 * Help function used by xrxCopyJobTicket() to build the CopyJobTicket.
 */
function xrxCopyJobProcessing(inputSides, scaling, finishing, color, collation, copies, outputSides, inputTray)
{
    return xrxCreateEscapedTag('JobProcessing', '',
        xrxCopyInput(inputSides, scaling) + xrxCopyOutput(finishing, color, collation, copies, outputSides, inputTray));
}

/**
 * Help function used by xrxCopyJobTicket() to build the CopyJobTicket.
 */
function xrxCopyInput(sides, scaling)
{
    var sidesTag = '';
    var scalingTag = '';

    if (sides != '')
    {
        sidesTag = xrxCreateEscapedTag('Sides', '', sides);
    }

    if (scaling.type != '') {
        var scalingTypeTag = xrxCreateEscapedTag('ScalingType', '', scaling.type);
        var scalingValueTag = '';
        var scalingXTag = xrxCreateEscapedTag('XScaling', '', '100');
        var scalingYTag = xrxCreateEscapedTag('YScaling', '', '100');
        switch (scaling.type)
        {
            case 'Proportional':
                if ((scaling.scalingProportional != '') && (scaling.scalingProportional != null) && (scaling.scalingProportional != 'undefined')) {
                    scalingValueTag = xrxCreateEscapedTag('ScaleProportional', '', xrxCreateEscapedTag('ScalingValue', '', scaling.scalingProportional));
                }
                else {
                    scalingValueTag = xrxCreateEscapedTag('ScaleProportional', '', xrxCreateEscapedTag('ScalingValue', '', '100'));
                }
                break;
            case 'Independent':
                if ((scaling.scalingX != '') && (scaling.scalingX != null) && (scaling.scalingX != 'undefined')) {
                    scalingXTag = xrxCreateEscapedTag('XScaling', '', scaling.scalingX);
                }
                if ((scaling.scalingY != '') && (scaling.scalingY != null) && (scaling.scalingY != 'undefined')) {
                    scalingYTag = xrxCreateEscapedTag('YScaling', '', scaling.scalingY);
                }
                scalingValueTag = xrxCreateEscapedTag('ScaleIndependent', '', scalingXTag + scalingYTag);
                break;
            default:
                break;
        }

        scalingTag = xrxCreateEscapedTag('Scaling', '', scalingTypeTag + scalingValueTag);
    }

    return xrxCreateEscapedTag('Input', '', sidesTag + scalingTag);
}

/**
 * Help function used by xrxCopyJobTicket() to build the CopyJobTicket.
 */
function xrxCopyOutput(finishing, color, collation, copies, sides, inputTray)
{
    var finishingTag = '';
    var colorTag = '';
    var collationTag = '';
    var copiesTag = '';
    var sidesTag = '';
    var inputTrayTag = '';

    finishingTag = xrxCreateEscapedTag('Finishings', '', xrxCopyFinishing( finishing ));


    if (color != '')
    {
        colorTag = xrxCreateEscapedTag('ColorEffectsType', '', color);
    }

    if (collation != '')
    {
        collationTag = xrxCreateEscapedTag('SheetCollate', '', collation);
    }

    if (copies != '')
    {
        copiesTag = xrxCreateEscapedTag('Copies', '', copies);
    }

    if (sides != '')
    {
        sidesTag = xrxCreateEscapedTag('Sides', '', sides);
    }

    if (inputTray != '')
    {
        inputTrayTag = xrxCreateEscapedTag('InputTraysCol', '', xrxCreateEscapedTag('InputTrayName', '', inputTray));
    }

    return xrxCreateEscapedTag('Output', '', finishingTag + colorTag + collationTag + copiesTag + sidesTag + inputTrayTag);
}

/**
 * Help function used by xrxCopyJobTicket() to build the CopyJobTicket.
 */
function xrxCopyFinishing( finishing ) {
    return xrxCreateEscapedTag('StapleFinishing', '', finishing.stapling) +
        xrxCreateEscapedTag('PunchFinishing', '', finishing.punching) +
        xrxCreateEscapedTag('FoldFinishing', '', finishing.folding);
}

/**
 * This function creates an xml tag in an escaped string.
 *
 * @param	label		tag
 * @param	type		attribute
 * @param	value		text value
 */
function xrxCreateEscapedTag(label, type, value) {
    if (type == "") {
        return ("&lt;" + label + "&gt;" + value + "&lt;/" + label + "&gt;");
    }
    else {
        return ("&lt;" + label + " " + type + "&gt;" + value + "&lt;/" + label + "&gt;");
    }
}

/*************************  End of File  *****************************/
