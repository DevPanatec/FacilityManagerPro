import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    const nonce = ctx?.res?.getHeader('X-Nonce') || ''
    return { ...initialProps, nonce }
  }

  render() {
    return (
      <Html>
        <Head nonce={this.props.nonce} />
        <body>
          <Main />
          <NextScript nonce={this.props.nonce} />
        </body>
      </Html>
    )
  }
}

export default MyDocument 