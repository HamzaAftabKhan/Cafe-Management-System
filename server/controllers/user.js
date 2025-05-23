const bcryptjs = require("bcryptjs");
const UserModel = require("../models/Users");
const nodemailer = require("nodemailer");
const Cookies = require("universal-cookie");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { response } = require("express");

require("dotenv").config();

const createUser = async (req, res) => {
  try {
    //getting data from request body
    const user = req.body;
    const password = user.password;

    console.log(user);

    if (!user || !password) {
      res.json({ error: "username and password is required" });
    }

    //checking if username already exists
    const existingUser = await UserModel.findOne({ username: user.username });

    if (existingUser) {
      return res.json({ error: "Username already exists" });
    }

    const salt = await bcryptjs.genSalt(11);
    const hashedPassword = await bcryptjs
      .hash(password, salt)
      .catch((err) => console.log(err));

    user.password = hashedPassword;
    user.Tokens = [];
    //creating new user in usermodel
    const newUser = new UserModel(user);

    //saving user
    await newUser.save();
    res.status(201).json({ username: newUser.username });
  } catch (err) {
    console.log(err);
    res.json({ error: "Server error" });
  }
};

const getUser = async (req, res) => {
  try {
    // Getting data from body
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
      return res.json({ error: "Username and password are required" });
    }

    // Finding in database
    const user = await UserModel.findOne({ username: username });

    // No user found
    if (!user) {
      return res.json({ error: "User not found" });
    }


    const isValidhashedPassword = await bcryptjs.compare(
      password.trim(),
      user.password.trim()
    );

    console.log(isValidhashedPassword);

    // Incorrect password
    if (!isValidhashedPassword) {
      return res.json({ error: "Incorrect password" });
    }

    // Send user data
    return res.status(200).json({
      name: user.name,
      username: user.username,
    });
  } catch (err) {
    console.log(err);
    return res.json({ error: "Server error" });
  }
};

// forget-password route
const forgotPassword = async (req, res) => {
  try {
    const username = req.body.username;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await UserModel.findOne({ username: username });
    console.log(user);
    if (!user) {
      return res.json({ status: false });
    }

    return res.json({ status: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.FROM_EMAIL_ADDRESS,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

let resetdone = false;

const markTokenAsConsumed = async (req, res) => {
  const { token, username } = req.body;
  try {
    const user = await UserModel.findOne({
      username: username,
      Tokens: {
        $elemMatch: {
          $eq: token,
        },
      },
    });
    if (user)
      res
        .status(200)
        .json({ status: true, message: "Token marked as consumed" });
    else {
      res
        .status(200)
        .json({ status: false, message: "Token marked as consumed" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });

    console.log(err);
  }
};

const sendEmail = async (req, res) => {
  const { to, username } = req.body;

  const payload = { username: username, resetdone: resetdone };
  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "5m" });

  const resetLink = process.env.ACCESS_URL + `/resetpassword?token=${token}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL_ADDRESS,
    to: to,
    subject: "Brewtopia Password Reset",
    html: `<!doctype html>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    
    <head>
      <!-- NAME: 1 COLUMN -->
      <!--[if gte mso 15]>
          <xml>
            <o:OfficeDocumentSettings>
              <o:AllowPNG/>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        <![endif]-->
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Lingo Password</title>
      <!--[if !mso]>
          <!-- -->
      <link href='https://fonts.googleapis.com/css?family=Asap:400,400italic,700,700italic' rel='stylesheet' type='text/css'>
      <!--<![endif]-->
      <style type="text/css">
        @media only screen and (min-width:768px){
              .templateContainer{
                  width:600px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              body,table,td,p,a,li,blockquote{
                  -webkit-text-size-adjust:none !important;
              }
      
      }   @media only screen and (max-width: 480px){
              body{
                  width:100% !important;
                  min-width:100% !important;
              }
      
      }   @media only screen and (max-width: 480px){
              #bodyCell{
                  padding-top:10px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImage{
                  width:100% !important;
              }
      
      }   @media only screen and (max-width: 480px){
             
       .mcnCaptionTopContent,.mcnCaptionBottomContent,.mcnTextContentContainer,.mcnBoxedTextContentContainer,.mcnImageGroupContentContainer,.mcnCaptionLeftTextContentContainer,.mcnCaptionRightTextContentContainer,.mcnCaptionLeftImageContentContainer,.mcnCaptionRightImageContentContainer,.mcnImageCardLeftTextContentContainer,.mcnImageCardRightTextContentContainer{
                  max-width:100% !important;
                  width:100% !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnBoxedTextContentContainer{
                  min-width:100% !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImageGroupContent{
                  padding:9px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnCaptionLeftContentOuter
       .mcnTextContent,.mcnCaptionRightContentOuter .mcnTextContent{
                  padding-top:9px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImageCardTopImageContent,.mcnCaptionBlockInner
       .mcnCaptionTopContent:last-child .mcnTextContent{
                  padding-top:18px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImageCardBottomImageContent{
                  padding-bottom:9px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImageGroupBlockInner{
                  padding-top:0 !important;
                  padding-bottom:0 !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImageGroupBlockOuter{
                  padding-top:9px !important;
                  padding-bottom:9px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnTextContent,.mcnBoxedTextContentColumn{
                  padding-right:18px !important;
                  padding-left:18px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcnImageCardLeftImageContent,.mcnImageCardRightImageContent{
                  padding-right:18px !important;
                  padding-bottom:0 !important;
                  padding-left:18px !important;
              }
      
      }   @media only screen and (max-width: 480px){
              .mcpreview-image-uploader{
                  display:none !important;
                  width:100% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Heading 1
          @tip Make the first-level headings larger in size for better readability
       on small screens.
          */
              h1{
                  /*@editable*/font-size:20px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Heading 2
          @tip Make the second-level headings larger in size for better
       readability on small screens.
          */
              h2{
                  /*@editable*/font-size:20px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Heading 3
          @tip Make the third-level headings larger in size for better readability
       on small screens.
          */
              h3{
                  /*@editable*/font-size:18px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Heading 4
          @tip Make the fourth-level headings larger in size for better
       readability on small screens.
          */
              h4{
                  /*@editable*/font-size:16px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Boxed Text
          @tip Make the boxed text larger in size for better readability on small
       screens. We recommend a font size of at least 16px.
          */
              .mcnBoxedTextContentContainer
       .mcnTextContent,.mcnBoxedTextContentContainer .mcnTextContent p{
                  /*@editable*/font-size:16px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Preheader Visibility
          @tip Set the visibility of the email's preheader on small screens. You
       can hide it to save space.
          */
              #templatePreheader{
                  /*@editable*/display:block !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Preheader Text
          @tip Make the preheader text larger in size for better readability on
       small screens.
          */
              #templatePreheader .mcnTextContent,#templatePreheader
       .mcnTextContent p{
                  /*@editable*/font-size:12px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Header Text
          @tip Make the header text larger in size for better readability on small
       screens.
          */
              #templateHeader .mcnTextContent,#templateHeader .mcnTextContent p{
                  /*@editable*/font-size:16px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Body Text
          @tip Make the body text larger in size for better readability on small
       screens. We recommend a font size of at least 16px.
          */
              #templateBody .mcnTextContent,#templateBody .mcnTextContent p{
                  /*@editable*/font-size:16px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }   @media only screen and (max-width: 480px){
          /*
          @tab Mobile Styles
          @section Footer Text
          @tip Make the footer content text larger in size for better readability
       on small screens.
          */
              #templateFooter .mcnTextContent,#templateFooter .mcnTextContent p{
                  /*@editable*/font-size:12px !important;
                  /*@editable*/line-height:150% !important;
              }
      
      }
      </style>
    </head>
    
    <body style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     background-color: #ecd3bd; height: 100%; margin: 0; padding: 0; width: 100%">
      <center>
        <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" id="bodyTable" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust:
     100%; background-color: #ecd3bd; height: 100%; margin: 0; padding: 0; width:
     100%" width="100%">
          <tr>
            <td align="center" id="bodyCell" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; border-top: 0;
     height: 100%; margin: 0; padding: 0; width: 100%" valign="top">
              <!-- BEGIN TEMPLATE // -->
              <!--[if gte mso 9]>
                  <table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;">
                    <tr>
                      <td align="center" valign="top" width="600" style="width:600px;">
                      <![endif]-->
              <table border="0" cellpadding="0" cellspacing="0" class="templateContainer" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; max-width:
     600px; border: 0" width="100%">
                <tr>
                  <td id="templatePreheader" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #ecd3bd;
     border-top: 0; border-bottom: 0; padding-top: 55px; padding-bottom: 8px" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnTextBlock" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     min-width:100%;" width="100%">
                      <tbody class="mcnTextBlockOuter">
                        <tr>
                          <td class="mcnTextBlockInner" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" class="mcnTextContentContainer" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust:
     100%; min-width:100%;" width="100%">
                              <tbody>
                                <tr>
                                  
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td id="templateHeader" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f7f7ff;
     border-top: 0; border-bottom: 0; padding-top: 16px; padding-bottom: 0" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnImageBlock" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     min-width:100%;" width="100%">
                      <tbody class="mcnImageBlockOuter">
                        <tr>
                          <td class="mcnImageBlockInner" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding:0px" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust:
     100%; min-width:100%;" width="100%">
                              <tbody>
                                <tr>
                                  <td class="mcnImageContent" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-right: 0px;
     padding-left: 0px; padding-top: 0; padding-bottom: 0; text-align:center;" valign="top">
                                        <img align="center" alt="Forgot your password?" class="mcnImage" src="https://static.lingoapp.com/assets/images/email/il-password-reset@2x.png" style="-ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none;
     text-decoration: none; vertical-align: bottom; max-width:1200px; padding-bottom:
     0; display: inline !important; vertical-align: bottom;" width="600"></img>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td id="templateBody" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f7f7ff;
     border-top: 0; border-bottom: 0; padding-top: 0; padding-bottom: 0" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnTextBlock" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; min-width:100%;" width="100%">
                      <tbody class="mcnTextBlockOuter">
                        <tr>
                          <td class="mcnTextBlockInner" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" class="mcnTextContentContainer" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust:
     100%; min-width:100%;" width="100%">
                              <tbody>
                                <tr>
                                <td style="margin-top: 30px;"></td>
                                  <td class="mcnTextContent" style='mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; word-break: break-word;
     color: #2a2a2a; font-family: "Asap", Helvetica, sans-serif; font-size: 16px;
     line-height: 150%; text-align: center; padding-top:9px; padding-right: 18px;
     padding-bottom: 9px; padding-left: 18px;' valign="top">
    
                                    <h1 class="null" style='color: #2a2a2a; font-family: "Asap", Helvetica,
     sans-serif; font-size: 32px; font-style: normal; font-weight: bold; line-height:
     125%; letter-spacing: 2px; text-align: center; display: block; margin: 0;
     padding: 0'><span style="text-transform:uppercase">Forgot</span></h1>
    
    
                                    <h2 class="null" style='color: #2a2a2a; font-family: "Asap", Helvetica,
     sans-serif; font-size: 24px; font-style: normal; font-weight: bold; line-height:
     125%; letter-spacing: 1px; text-align: center; display: block; margin: 0;
     padding: 0'><span style="text-transform:uppercase">your password?</span></h2>
    
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnTextBlock" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace:
     0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     min-width:100%;" width="100%">
                      <tbody class="mcnTextBlockOuter">
                        <tr>
                          <td class="mcnTextBlockInner" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" class="mcnTextContentContainer" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust:
     100%; min-width:100%;" width="100%">
                              <tbody>
                                <tr>
                                  <td class="mcnTextContent" style='mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; word-break: break-word;
     color: #2a2a2a; font-family: "Asap", Helvetica, sans-serif; font-size: 16px;
     line-height: 150%; text-align: center; padding-top:9px; padding-right: 18px;
     padding-bottom: 9px; padding-left: 18px;' valign="top">Not to worry, we got you! Let’s get you a new password.
                                    <br></br>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnButtonBlock" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     min-width:100%;" width="100%">
                      <tbody class="mcnButtonBlockOuter">
                        <tr>
                          <td align="center" class="mcnButtonBlockInner" style="mso-line-height-rule:
     exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     padding-top:18px; padding-right:18px; padding-bottom:18px; padding-left:18px;" valign="top">
                            <table border="0" cellpadding="0" cellspacing="0" class="mcnButtonBlock" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; min-width:100%;" width="100%">
                              <tbody class="mcnButtonBlockOuter">
                                <tr>
                                  <td align="center" class="mcnButtonBlockInner" style="mso-line-height-rule:
     exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" class="mcnButtonContentContainer" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     border-collapse: separate !important;border-radius: 48px;background-color:
     #54290c;">
                                      <tbody>
                                        <tr>
                                          <td align="center" class="mcnButtonContent" style="mso-line-height-rule:
     exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;
     font-family: 'Asap', Helvetica, sans-serif; font-size: 16px; padding-top:24px;
     padding-right:48px; padding-bottom:24px; padding-left:48px;" valign="middle">
                                            <a class="mcnButton " href="${resetLink}" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; display: block; 
     font-weight: normal; text-decoration: none; font-weight: normal;letter-spacing:
     1px;line-height: 100%;text-align: center;text-decoration: none;color:
     #FFFFFF; text-transform:uppercase;" target="_blank" title="Review Lingo kit
     invitation">Reset password</a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnImageBlock" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; min-width:100%;" width="100%">
                      <tbody class="mcnImageBlockOuter">
                        <tr>
                          <td class="mcnImageBlockInner" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding:0px" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="border-collapse: collapse; mso-table-lspace: 0;
     mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust:
     100%; min-width:100%;" width="100%">
                              <tbody>
                                <tr>
                                  <td class="mcnImageContent" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; padding-right: 0px;
     padding-left: 0px; padding-top: 0; padding-bottom: 0; text-align:center;" valign="top"></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td id="templateFooter" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #ecd3bd;
     border-top: 0; border-bottom: 0; padding-top: 8px; padding-bottom: 80px" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" class="mcnTextBlock" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; min-width:100%;" width="100%">
                      <tbody class="mcnTextBlockOuter">
                        <tr>
                          <td class="mcnTextBlockInner" style="mso-line-height-rule: exactly;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%" valign="top">
                              
                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0;
     -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; min-width:100%;" width="100%">
                              <tbody>
                                <tbody></tbody>
                              </tbody>
                            </table>
        
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </table>
              <!--[if gte mso 9]>
                      </td>
                    </tr>
                  </table>
                <![endif]-->
              <!-- // END TEMPLATE -->
            </td>
          </tr>
        </table>
      </center>
    </body>
    
    </html>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  const { username, newPassword, token } = req.body;
  const salt = await bcryptjs.genSalt(11);
  const hashedPassword = await bcryptjs
    .hash(newPassword, salt)
    .catch((err) => console.log(err));

  try {
    const result = await UserModel.updateOne(
      { username: username },
      {
        $set: {
          password: hashedPassword,
        },
        $addToSet: {
          Tokens: token,
        },
      }
    );
    if (result.matchedCount === 1) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.json({ error: "Internal server error" });

    console.log(error);
  }
};

module.exports = {
  createUser,
  getUser,
  forgotPassword,
  sendEmail,
  resetPassword,
  markTokenAsConsumed,
};
